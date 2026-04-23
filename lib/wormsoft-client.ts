import {
  normalizeCallAnalysisResponse,
  normalizeCompanyProfileResponse,
  type CallAnalysisResponse,
  type CompanyProfileResponse,
} from "@/lib/wormsoft-types";

const DEFAULT_WORMSOFT_URL = "https://ai.wormsoft.ru/api/gpt/responses";
const DEFAULT_MODEL = "openai/gpt-5.2";

export class WormsoftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WormsoftError";
  }
}

type WormsoftMessageContent =
  | { type?: string; text?: string }
  | Record<string, unknown>;

type WormsoftOutputItem = {
  type?: string;
  role?: string;
  content?: WormsoftMessageContent[];
  [key: string]: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Извлекает итоговый текст из ответа Responses API (OpenAI-совместимый формат Wormsoft).
 * Обходит output[], не полагаясь только на output[0].
 */
export function extractWormsoftResponseText(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new WormsoftError("Ответ провайдера не является JSON-объектом");
  }

  const direct = payload.output_text;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const output = payload.output;
  if (!Array.isArray(output)) {
    throw new WormsoftError("В ответе провайдера нет поля output или оно не массив");
  }

  const chunks: string[] = [];

  const nonTextOutputTypes = new Set([
    "reasoning",
    "function_call",
    "file_search_call",
    "web_search_call",
  ]);

  for (const item of output as WormsoftOutputItem[]) {
    if (!item || typeof item !== "object") continue;
    if (item.type && nonTextOutputTypes.has(String(item.type))) continue;
    if (item.role && item.role !== "assistant") continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const b = block as { type?: string; text?: string };
      if (b.text && typeof b.text === "string") {
        const t = b.text.trim();
        if (t) chunks.push(t);
      }
    }
  }

  let joined = chunks.join("\n").trim();
  if (!joined && isRecord(payload)) {
    const choices = payload.choices;
    if (Array.isArray(choices)) {
      for (const ch of choices) {
        if (!ch || typeof ch !== "object") continue;
        const msg = (ch as Record<string, unknown>).message;
        if (msg && typeof msg === "object") {
          const content = (msg as Record<string, unknown>).content;
          if (typeof content === "string" && content.trim()) {
            joined = content.trim();
            break;
          }
        }
      }
    }
  }

  if (!joined) {
    throw new WormsoftError("Не удалось извлечь текст ответа модели из output");
  }
  return joined;
}

function extractJsonObject(raw: string): string {
  const startIdx = raw.indexOf("{");
  const endIdx = raw.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    return raw.slice(startIdx, endIdx + 1);
  }
  return raw.trim();
}

export async function callWormsoft<TResponse>(args: {
  system: string;
  user: string;
  model?: string;
}): Promise<TResponse> {
  const apiUrl =
    process.env.WORMSOFT_API_URL?.trim() || DEFAULT_WORMSOFT_URL;
  const apiKey = process.env.WORMSOFT_API_KEY?.trim();
  if (!apiKey) {
    throw new WormsoftError("Не задан WORMSOFT_API_KEY");
  }

  const model =
    args.model?.trim() ||
    process.env.WORMSOFT_MODEL?.trim() ||
    DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Сетевая ошибка";
    throw new WormsoftError(`Запрос к Wormsoft не выполнен: ${msg}`);
  }

  const rawBody = await res.text();
  if (!res.ok) {
    throw new WormsoftError(
      `Wormsoft вернул HTTP ${res.status}: не удалось получить ответ модели`
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    throw new WormsoftError("Ответ Wormsoft не является валидным JSON");
  }

  const text = extractWormsoftResponseText(json);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>;
  } catch {
    throw new WormsoftError("Текст модели не удалось разобрать как JSON-объект");
  }

  return parsed as TResponse;
}

export async function callWormsoftCompanyProfile(args: {
  system: string;
  user: string;
  model?: string;
}): Promise<CompanyProfileResponse> {
  const raw = await callWormsoft<Record<string, unknown>>(args);
  return normalizeCompanyProfileResponse(raw);
}

export async function callWormsoftCallAnalysis(args: {
  system: string;
  user: string;
  model?: string;
}): Promise<CallAnalysisResponse> {
  const raw = await callWormsoft<Record<string, unknown>>(args);
  return normalizeCallAnalysisResponse(raw);
}
