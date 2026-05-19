import OpenAI from "openai";
import { toFile } from "openai/uploads";
import {
  normalizeCallAnalysisResponse,
  normalizeCompanyProfileResponse,
  type CallAnalysisResponse,
  type CompanyProfileResponse,
} from "@/lib/wormsoft-types";

export class OpenAICallAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAICallAnalysisError";
  }
}

export function requireOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function createOpenAIClient(): OpenAI {
  const apiKey = requireOpenAIApiKey();
  if (!apiKey) {
    throw new OpenAICallAnalysisError("Не задан OPENAI_API_KEY в окружении");
  }
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

/** Whisper transcription for call audio (mp3, wav, webm, m4a, etc.). */
export async function transcribeCallAudio(
  buffer: Buffer,
  filename: string,
  mimeType?: string | null,
): Promise<string> {
  const openai = createOpenAIClient();
  try {
    const file = await toFile(buffer, filename, {
      type: mimeType || "application/octet-stream",
    });
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ru",
    });
    return result.text?.trim() ?? "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new OpenAICallAnalysisError(`Транскрипция не удалась: ${msg}`);
  }
}

/** GPT-4o structured call analysis (CallAnalysisResponse shape). */
export async function analyzeCallTranscript(args: {
  system: string;
  user: string;
}): Promise<CallAnalysisResponse> {
  const openai = createOpenAIClient();
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw?.trim()) {
      throw new OpenAICallAnalysisError("Пустой ответ модели анализа");
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeCallAnalysisResponse(parsed);
  } catch (e) {
    if (e instanceof OpenAICallAnalysisError) throw e;
    if (e instanceof SyntaxError) {
      throw new OpenAICallAnalysisError(
        "Ответ модели не является валидным JSON",
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new OpenAICallAnalysisError(`Анализ звонка не удался: ${msg}`);
  }
}

/** GPT-4o structured company profile from site HTML/text (CompanyProfileResponse shape). */
export async function parseCompanyProfileWithOpenAI(args: {
  system: string;
  user: string;
}): Promise<CompanyProfileResponse> {
  const openai = createOpenAIClient();
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw?.trim()) {
      throw new OpenAICallAnalysisError("Пустой ответ модели парсинга сайта");
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeCompanyProfileResponse(parsed);
  } catch (e) {
    if (e instanceof OpenAICallAnalysisError) throw e;
    if (e instanceof SyntaxError) {
      throw new OpenAICallAnalysisError(
        "Ответ модели не является валидным JSON",
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new OpenAICallAnalysisError(`Парсинг сайта не удался: ${msg}`);
  }
}
