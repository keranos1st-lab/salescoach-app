import { buildProductCallSignals } from "@/lib/call-analysis-product-layer";
import {
  companyProfileFromJson,
  type CompanyProfile,
} from "@/lib/company-profile";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase-service";
import {
  callWormsoftCallAnalysis,
  WormsoftError,
} from "@/lib/wormsoft-client";
import type { CallAnalysisResponse } from "@/lib/wormsoft-types";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export type { CallAnalysisResponse } from "@/lib/wormsoft-types";

const MAX_BYTES = 25 * 1024 * 1024;

const CALL_ANALYSIS_JSON_SCHEMA = `{
  "script_following": number,           // 0–10: следование скрипту/структуре разговора
  "objection_handling": number,        // 0–10: работа с возражениями
  "tone_and_rapport": number,          // 0–10: тон, контакт, эмпатия
  "next_step_clarity": number,         // 0–10: ясность следующего шага
  "upsell_attempts": number,           // 0–10: попытки допродажи / расширения сделки
  "competitor_differentiation": number, // 0–10: отстройка от конкурентов, УТП
  "summary": string,                   // общий вывод по звонку (кратко, по делу)
  "mistakes": string[],                // ключевые ошибки менеджера
  "good_points": string[]              // сильные стороны менеджера в этом звонке
}`;

const SYSTEM_CALL_ANALYSIS = `Ты — руководитель отдела продаж и тренер по продажам. Твоя задача — анализировать диалог менеджера с клиентом по транскрипту и выставлять оценки по нескольким критериям (0–10), а также формировать краткий текстовый разбор. Всегда отвечай строго валидным JSON по заданной схеме, без лишнего текста и без форматирования.`;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "audio";
}

type ExtendedAnalysis = {
  score: number;
  positives: string[];
  negatives: string[];
  next_task: string;
  product_context_used: boolean;
  matched_services: string[];
  matched_products: string[];
  matched_usps: string[];
  matched_upsells: string[];
  product_notes: string[];
};

function profileContextBlock(profile: CompanyProfile | null): string {
  if (!profile) return "Профиль компании в системе не заполнен.";
  const payload = {
    niche: profile.niche,
    services: profile.services,
    products: profile.products,
    unique_selling_points: profile.unique_selling_points,
    upsell_services: profile.upsell_services,
    min_check: profile.min_check,
    anti_ideal_clients: profile.anti_ideal_clients,
  };
  try {
    return JSON.stringify(payload, null, 0);
  } catch {
    return "Профиль компании в системе не заполнен.";
  }
}

function mapCallAnalysisToExtended(
  raw: CallAnalysisResponse,
  signals: ReturnType<typeof buildProductCallSignals>
): ExtendedAnalysis {
  const dims = [
    raw.script_following,
    raw.objection_handling,
    raw.tone_and_rapport,
    raw.next_step_clarity,
    raw.upsell_attempts,
    raw.competitor_differentiation,
  ];
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  const score = Math.min(100, Math.max(1, Math.round(avg * 10)));

  const positives = [...raw.good_points, ...signals.supplemental_positives];
  const negatives = [...raw.mistakes, ...signals.supplemental_negatives];

  const next_task = raw.summary.trim().slice(0, 2500);

  return {
    score,
    positives: positives.length
      ? positives
      : [
          "Сильные стороны не выделены явно — ориентируйтесь на численные оценки по критериям.",
        ],
    negatives: negatives.length
      ? negatives
      : [
          "Ключевые ошибки не выделены явно — пересмотрите транскрипт и критерии оценки.",
        ],
    next_task:
      next_task ||
      "Зафиксируйте один конкретный следующий шаг с клиентом и проговорите его в конце следующего звонка.",
    product_context_used: signals.product_context_used,
    matched_services: signals.matched_services,
    matched_products: signals.matched_products,
    matched_usps: signals.matched_usps,
    matched_upsells: signals.matched_upsells,
    product_notes: signals.product_notes,
  };
}

function buildCallUserPrompt(transcript: string, profile: CompanyProfile | null) {
  return `Вот транскрипт звонка менеджера с клиентом:

\`\`\`text
${transcript}
\`\`\`

Контекст продукта компании (используй только как опору; не придумывай фактов, которых нет в транскрипте):
${profileContextBlock(profile)}

Проанализируй этот диалог и заполни JSON по следующей схеме (типы полей):
${CALL_ANALYSIS_JSON_SCHEMA}

Не выдумывай факты, которых нет в транскрипте, и обязательно придерживайся границ 0–10 для оценок.`;
}

async function assemblyAiResponseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AssemblyAI error: ${errorText.trim() || response.statusText}`
    );
  }
  return (await response.json()) as T;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx?.user.companyId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }
    const userId = ctx.user.id;
    const companyId = ctx.user.companyId;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const wormsoftKey = process.env.WORMSOFT_API_KEY?.trim();
      if (!wormsoftKey) {
        return NextResponse.json(
          { error: "Не задан WORMSOFT_API_KEY в окружении" },
          { status: 500 }
        );
      }

      const body = (await request.json()) as { transcript?: string };
      const transcript =
        typeof body.transcript === "string" ? body.transcript.trim() : "";
      if (!transcript) {
        return NextResponse.json(
          { error: "Передайте непустой transcript" },
          { status: 400 }
        );
      }

      const transcriptForModel =
        transcript.length > 48_000 ? transcript.slice(0, 48_000) : transcript;

      const companyRow = await prisma.company.findUnique({
        where: { id: companyId },
        select: { profile: true },
      });
      const companyProfile: CompanyProfile | null = companyRow?.profile
        ? companyProfileFromJson(companyRow.profile, userId)
        : null;

      try {
        const result = await callWormsoftCallAnalysis({
          system: SYSTEM_CALL_ANALYSIS,
          user: buildCallUserPrompt(transcriptForModel, companyProfile),
        });
        return NextResponse.json(result);
      } catch (e) {
        if (e instanceof WormsoftError) {
          return NextResponse.json({ error: e.message }, { status: 502 });
        }
        throw e;
      }
    }

    const wormsoftKey = process.env.WORMSOFT_API_KEY?.trim();
    if (!wormsoftKey) {
      return NextResponse.json(
        { error: "Не задан WORMSOFT_API_KEY в окружении" },
        { status: 500 }
      );
    }

    console.log("[calls/analyze] supabase env (no secrets)", {
      hasNextPublicSupabaseUrl: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      ),
      hasSupabaseServiceRoleKey: Boolean(
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ),
      supabaseStorageCallsBucket:
        process.env.SUPABASE_STORAGE_CALLS_BUCKET?.trim() || "calls",
    });
    console.log(
      "[calls/analyze] SUPABASE_STORAGE_CALLS_BUCKET JSON:",
      JSON.stringify(process.env.SUPABASE_STORAGE_CALLS_BUCKET ?? null)
    );

    const supabase = createSupabaseServiceClient();

    const requestFormData = await request.formData();
    const file = requestFormData.get("file");
    const managerId = requestFormData.get("managerId");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Добавьте аудиофайл" }, { status: 400 });
    }

    if (typeof managerId !== "string" || !managerId) {
      return NextResponse.json({ error: "Выберите менеджера" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файл больше 25 МБ" }, { status: 400 });
    }

    const manager = await prisma.manager.findFirst({
      where: {
        id: managerId,
        companyId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!manager) {
      return NextResponse.json(
        { error: "Менеджер не найден или нет доступа" },
        { status: 403 }
      );
    }

    const companyRow = await prisma.company.findUnique({
      where: { id: companyId },
      select: { profile: true },
    });
    const companyProfile: CompanyProfile | null = companyRow?.profile
      ? companyProfileFromJson(companyRow.profile, userId)
      : null;

    const origName = file.name || "recording.webm";
    const ext = origName.includes(".")
      ? origName.slice(origName.lastIndexOf("."))
      : ".webm";
    const base = sanitizeFilename(origName.replace(/\.[^.]+$/, ""));
    const finalPath = `${userId}/${randomUUID()}-${base}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Storage: серверный клиент с SUPABASE_SERVICE_ROLE_KEY (обходит Storage RLS).
    const bucketId =
      process.env.SUPABASE_STORAGE_CALLS_BUCKET?.trim() || "calls";
    let uploadErr;
    try {
      const uploadResult = await supabase.storage.from(bucketId).upload(finalPath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      uploadErr = uploadResult.error;
    } catch (error) {
      console.error("[storage upload thrown]", {
        "error instanceof Error": error instanceof Error,
        name: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error.cause : undefined,
      });
      throw error;
    }

    if (uploadErr) {
      const httpStatusFromErr =
        "status" in uploadErr && typeof uploadErr.status === "number"
          ? uploadErr.status
          : undefined;
      const storageStatusCode =
        "statusCode" in uploadErr && uploadErr.statusCode != null
          ? String(uploadErr.statusCode)
          : undefined;

      const errMessage =
        typeof uploadErr.message === "string" && uploadErr.message.trim()
          ? uploadErr.message.trim()
          : "Загрузка в Storage завершилась с ошибкой без текста от провайдера.";

      console.error("[storage upload failed]", {
        bucket: bucketId,
        objectPath: finalPath,
        contentType: file.type || "application/octet-stream",
        responseStatus: httpStatusFromErr,
        storageErrorCode: storageStatusCode,
        message: errMessage,
      });

      const httpStatus =
        typeof httpStatusFromErr === "number" &&
        httpStatusFromErr >= 400 &&
        httpStatusFromErr < 600
          ? httpStatusFromErr
          : 500;

      return NextResponse.json({ error: errMessage }, { status: httpStatus });
    }

    console.log("[calls/analyze] assemblyai env", {
      hasKey: Boolean(process.env.ASSEMBLYAI_API_KEY?.trim()),
      keyLength: process.env.ASSEMBLYAI_API_KEY?.trim()?.length ?? 0,
    });

    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
    if (!assemblyApiKey) {
      return NextResponse.json(
        { error: "Не задан ASSEMBLYAI_API_KEY в окружении" },
        { status: 500 }
      );
    }

    const audioBuffer = buffer;
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: assemblyApiKey,
        "content-type": "application/octet-stream",
      },
      body: audioBuffer,
    });
    const uploadJson = await assemblyAiResponseJson<{
      upload_url?: string;
      error?: string;
    }>(uploadRes);
    const uploadUrl = uploadJson.upload_url;
    if (!uploadUrl) {
      return NextResponse.json(
        {
          error:
            uploadJson.error || "AssemblyAI upload: нет upload_url в ответе",
        },
        { status: 500 }
      );
    }

    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: "ru",
        speech_models: ["universal-2"],
      }),
    });
    const transcriptCreateJson = await assemblyAiResponseJson<{
      id?: string;
      error?: string;
    }>(transcriptRes);
    const transcriptId = transcriptCreateJson.id;
    if (!transcriptId) {
      return NextResponse.json(
        {
          error:
            transcriptCreateJson.error ||
            "AssemblyAI: в ответе нет id транскрипта",
        },
        { status: 500 }
      );
    }

    let transcript = "";
    while (true) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: assemblyApiKey },
        }
      );
      const pollData = await assemblyAiResponseJson<{
        status?: string;
        text?: string;
        error?: string;
      }>(pollRes);
      if (pollData.status === "completed") {
        transcript = pollData.text ?? "";
        break;
      }
      if (pollData.status === "error") {
        throw new Error("Transcription failed");
      }
    }
    const transcriptText = transcript.trim();
    const transcriptForModel =
      transcriptText.length > 48_000 ? transcriptText.slice(0, 48_000) : transcriptText;

    const productSignals = buildProductCallSignals(transcriptText, companyProfile);

    let worm: CallAnalysisResponse;
    try {
      worm = await callWormsoftCallAnalysis({
        system: SYSTEM_CALL_ANALYSIS,
        user: buildCallUserPrompt(transcriptForModel, companyProfile),
      });
    } catch (e) {
      if (e instanceof WormsoftError) {
        return NextResponse.json({ error: e.message }, { status: 502 });
      }
      throw e;
    }

    const analysis = mapCallAnalysisToExtended(worm, productSignals);

    let callRow;
    try {
      callRow = await prisma.call.create({
        data: {
          companyId,
          managerId,
          audioUrl: finalPath,
          transcript: transcriptText,
          score: analysis.score,
        },
      });
    } catch (insertErr) {
      console.error(insertErr);
      return NextResponse.json(
        { error: "Не удалось сохранить звонок в базу" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      call: {
        id: callRow.id,
        score: callRow.score,
        positives: analysis.positives,
        negatives: analysis.negatives,
        next_task: analysis.next_task,
        transcript: callRow.transcript,
        created_at: callRow.createdAt.toISOString(),
        audio_url: callRow.audioUrl,
      },
      analysis,
    });
  } catch (e) {
    console.error(e);
    const message =
      e instanceof Error ? e.message : "Внутренняя ошибка при анализе";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
