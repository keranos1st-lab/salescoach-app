import {
  assertProductAccess,
  isProductAccessDenied,
} from "@/lib/assert-product-access";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;
export const preferredRegion = "iad1";

export const REPORT_RISK_ID_CATALOG = [
  {
    id: "price_objection_handling",
    description: "проблемы с отработкой возражений по цене",
  },
  { id: "upsell_missed", description: "не использует допродажи" },
  {
    id: "competitor_positioning_weak",
    description: "слабая отстройка от конкурентов",
  },
  { id: "discovery_shallow", description: "поверхностно выявляет потребности" },
  {
    id: "next_steps_unclear",
    description: "не фиксирует чёткий следующий шаг",
  },
  {
    id: "script_structure_weak",
    description: "не держит структуру разговора",
  },
  { id: "rapport_weak", description: "плохо выстраивает контакт" },
  {
    id: "talk_ratio_high",
    description: "слишком много говорит, мало слушает",
  },
  {
    id: "followup_missing",
    description: "не договаривается о продолжении контакта",
  },
  { id: "other", description: "прочий риск, не попавший в каталог" },
] as const;

export type ReportRiskId = (typeof REPORT_RISK_ID_CATALOG)[number]["id"];

export type ReportRiskItem = {
  risk_id: string;
  text: string;
};

export type ManagerRiskAction = {
  risk_id: string;
  risk: string;
  actions: string[];
};

export type ManagerRiskActionsMap = Record<string, ManagerRiskAction[]>;

type ReportJson = {
  average_score: number | null;
  period_score: number | null;
  summary: string;
  strengths: string[];
  weaknesses: ReportRiskItem[];
  coaching_focus: string[];
  skill_breakdown: SkillBreakdownItem[];
  repeated_patterns: ReportRiskItem[];
  manager_notes: string[];
  manager_risk_actions: ManagerRiskActionsMap;
};

const ALLOWED_REPORT_RISK_IDS = new Set<string>(
  REPORT_RISK_ID_CATALOG.map((item) => item.id),
);

function formatRiskIdCatalogForPrompt(): string {
  return REPORT_RISK_ID_CATALOG.map(
    (item) => `- ${item.id} — ${item.description}`,
  ).join("\n");
}

function normalizeRiskId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";
  return ALLOWED_REPORT_RISK_IDS.has(id) ? id : "other";
}

function inferRiskIdFromText(text: string): string {
  const t = normalize(text);
  if (/цен|стоим|скидк|возраж|дорого/.test(t)) return "price_objection_handling";
  if (/допрод|апсел|дополнительн/.test(t)) return "upsell_missed";
  if (/конкурент|отстрой|утп|преимущ/.test(t)) return "competitor_positioning_weak";
  if (/потребност|квалиф|выявл|запрос клиента/.test(t)) return "discovery_shallow";
  if (/следующ|шаг|назнач|зафиксир|дожим/.test(t)) return "next_steps_unclear";
  if (/структур|дисциплин/.test(t)) return "script_structure_weak";
  if (/контакт|rapport|доверие/.test(t)) return "rapport_weak";
  if (/много говорит|слушает мало|talk ratio/.test(t)) return "talk_ratio_high";
  if (/follow|продолжен|перезвон|связаться/.test(t)) return "followup_missing";
  return "other";
}

function toRiskItem(text: string, riskId?: string): ReportRiskItem {
  const trimmed = text.trim();
  return {
    risk_id: riskId ? normalizeRiskId(riskId) : inferRiskIdFromText(trimmed),
    text: trimmed,
  };
}

function parseRiskItems(value: unknown, fieldName: string): ReportRiskItem[] {
  if (!Array.isArray(value)) return [];

  const result: ReportRiskItem[] = [];
  let legacyFormat = false;

  for (const item of value.slice(0, 8)) {
    if (typeof item === "string") {
      legacyFormat = true;
      const text = item.trim();
      if (text) result.push(toRiskItem(text));
      continue;
    }
    if (typeof item === "object" && item !== null) {
      const row = item as Record<string, unknown>;
      const text =
        typeof row.text === "string"
          ? row.text.trim()
          : typeof row.risk === "string"
            ? row.risk.trim()
            : "";
      if (!text) continue;
      result.push({
        risk_id: normalizeRiskId(row.risk_id),
        text,
      });
    }
  }

  if (legacyFormat && process.env.NODE_ENV === "development") {
    console.warn(
      `[reports/generate] Legacy string[] for ${fieldName}; mapped to { risk_id, text }`,
    );
  }

  return result;
}

type SkillStatus = "strong" | "ok" | "risk" | "no_data";

type SkillBreakdownItem = {
  key: string;
  label: string;
  status: SkillStatus;
  value: number | null;
  comment: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((v) => v.trim()).filter(Boolean);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function mapSkillStatus(value: number | null): SkillStatus {
  if (value == null) return "no_data";
  if (value >= 70) return "strong";
  if (value >= 50) return "ok";
  return "risk";
}

function statusComment(status: SkillStatus, label: string): string {
  if (status === "strong") return `${label}: навык используется стабильно.`;
  if (status === "ok") return `${label}: есть база, можно усилить системность.`;
  if (status === "risk") return `${label}: зона риска, нужен целевой разбор.`;
  return `${label}: недостаточно сигналов в анализах звонков за период.`;
}

function scoreSkill(
  key: string,
  label: string,
  positivesText: string,
  negativesText: string,
  positiveSignals: string[],
  negativeSignals: string[]
): SkillBreakdownItem {
  const pos = positiveSignals.reduce(
    (acc, signal) => acc + (positivesText.includes(signal) ? 1 : 0),
    0
  );
  const neg = negativeSignals.reduce(
    (acc, signal) => acc + (negativesText.includes(signal) ? 1 : 0),
    0
  );
  const touched = pos + neg > 0;
  const value = touched ? clamp(50 + (pos - neg) * 15, 10, 95) : null;
  const status = mapSkillStatus(value);

  return {
    key,
    label,
    status,
    value: value == null ? null : Number(value.toFixed(1)),
    comment: statusComment(status, label),
  };
}

function computeSkillBreakdown(
  allPositives: string[],
  allNegatives: string[]
): SkillBreakdownItem[] {
  const positivesText = normalize(allPositives.join(" "));
  const negativesText = normalize(allNegatives.join(" "));

  return [
    scoreSkill(
      "usp",
      "УТП",
      positivesText,
      negativesText,
      ["утп", "уникальн", "преимуще", "ценност"],
      ["утп", "уникальн", "без преимуществ", "не объяснил почему мы"]
    ),
    scoreSkill(
      "upsell",
      "Допродажи",
      positivesText,
      negativesText,
      ["допрод", "апсел", "дополнительн", "расширил чек"],
      ["допрод", "не предложил дополнительн", "упущена допродажа"]
    ),
    scoreSkill(
      "competition",
      "Отстройка от конкурентов",
      positivesText,
      negativesText,
      ["отстройк", "конкурент", "чем мы отличаемся"],
      ["конкурент", "не отстроился", "сравнение только по цене"]
    ),
    scoreSkill(
      "qualification",
      "Квалификация",
      positivesText,
      negativesText,
      ["квалиф", "выявил потреб", "уточнил задачу", "бюджет", "критерии"],
      ["не выявил потреб", "без квалификац", "не уточнил бюджет", "поверхностно"]
    ),
    scoreSkill(
      "price",
      "Работа с ценой",
      positivesText,
      negativesText,
      ["цена", "стоимость", "обосновал цену", "ценност"],
      ["дешево", "скидк", "не отработал цену", "уперлись в цену"]
    ),
    scoreSkill(
      "objections",
      "Работа с возражениями",
      positivesText,
      negativesText,
      ["возраж", "отработал сомнения", "снял опасения"],
      ["не отработал возраж", "пропустил возраж", "спор с клиентом"]
    ),
    scoreSkill(
      "closing",
      "Дожим / следующий шаг",
      positivesText,
      negativesText,
      ["следующий шаг", "дожал", "зафиксировал дату", "назначил"],
      ["нет следующего шага", "не зафиксировал", "размытое завершение"]
    ),
    scoreSkill(
      "product_context",
      "Продуктовый контекст",
      positivesText,
      negativesText,
      ["продукт", "услуг", "утп", "допрод", "контекст продукта"],
      ["слишком общий", "не привязан к продукту", "без продукта"]
    ),
  ];
}

function toSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

function stripRawSpeech(value: string): string {
  return value
    .replace(/["'«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapSignalToThesis(raw: string, type: "strength" | "weakness"): string | null {
  const text = normalize(stripRawSpeech(raw));
  if (!text) return null;

  if (/балкон|отделк|что менять|что имен|запрос|потребност|цель клиента/.test(text)) {
    return type === "strength"
      ? "Точнее выявляет запрос клиента"
      : "Нужно точнее выявлять запрос клиента";
  }
  if (/замер|запис|дата|время|следующ|назнач|выезд/.test(text)) {
    return type === "strength"
      ? "Переводит разговор к следующему шагу"
      : "Слабо фиксирует следующий шаг";
  }
  if (/цен|стоимост|ориентир|бюджет|дешев|скидк/.test(text)) {
    return type === "strength"
      ? "Даёт базовый ценовой ориентир"
      : "Слабо управляет диалогом о цене";
  }
  if (/возраж|сомнен|опасен/.test(text)) {
    return type === "strength"
      ? "Работает с ключевыми возражениями"
      : "Возражения отрабатываются непоследовательно";
  }
  if (/утп|преимущ|чем мы отлич|конкурент/.test(text)) {
    return type === "strength"
      ? "Подчеркивает отличия от конкурентов"
      : "Слабо показывает отличия от конкурентов";
  }
  if (/допрод|апсел|дополнительн/.test(text)) {
    return type === "strength" ? "Использует потенциал допродаж" : "Потенциал допродаж используется слабо";
  }
  if (/квалиф|критер|объем|срок/.test(text)) {
    return type === "strength" ? "Проводит базовую квалификацию" : "Квалификация клиента неполная";
  }
  if (/продукт|услуг|общий разговор|не привязан к продукту/.test(text)) {
    return type === "strength"
      ? "Держит разговор в продуктовом контексте"
      : "Разговор часто уходит в общий контур без продукта";
  }

  if (text.length < 18) return null;
  return type === "strength"
    ? "Стабильно ведёт структуру разговора"
    : "Структура разговора требует большей дисциплины";
}

function buildTheses(items: string[], type: "strength" | "weakness", limit: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const thesis = mapSignalToThesis(item, type);
    if (!thesis) continue;
    counts.set(thesis, (counts.get(thesis) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([thesis]) => toSentence(thesis));
}

function buildRepeatedPatternTitles(items: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const mapped = mapSignalToThesis(item, "weakness");
    if (!mapped) continue;
    counts.set(mapped, (counts.get(mapped) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([title, count]) => (count > 1 ? `${title} — ${count}` : title));
}

function topRepeated(items: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = normalize(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => (count > 1 ? `${key} — ${count} раза` : key));
}

function parseManagerRiskActions(value: unknown): ManagerRiskActionsMap {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const result: ManagerRiskActionsMap = {};
  for (const [managerName, entries] of Object.entries(value)) {
    if (!Array.isArray(entries)) continue;
    const parsed: ManagerRiskAction[] = [];
    for (const entry of entries.slice(0, 3)) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      const risk = typeof row.risk === "string" ? row.risk.trim() : "";
      const actions = asStringArray(row.actions).slice(0, 3);
      if (!risk || actions.length === 0) continue;
      const risk_id = row.risk_id
        ? normalizeRiskId(row.risk_id)
        : inferRiskIdFromText(risk);
      parsed.push({ risk_id, risk, actions });
    }
    if (parsed.length > 0) {
      result[managerName.trim()] = parsed;
    }
  }
  return result;
}

function parseReportJson(raw: string): ReportJson {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const averageScore = asFiniteNumber(parsed.average_score ?? parsed.avgScore);
  const periodScore = asFiniteNumber(parsed.period_score ?? averageScore);

  return {
    average_score: averageScore == null ? null : Number(averageScore.toFixed(1)),
    period_score: periodScore == null ? null : Number(periodScore.toFixed(1)),
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Краткий вывод не предоставлен.",
    strengths: asStringArray(parsed.strengths).slice(0, 6),
    weaknesses: parseRiskItems(parsed.weaknesses, "weaknesses").slice(0, 6),
    coaching_focus: asStringArray(parsed.coaching_focus).slice(0, 6),
    skill_breakdown: Array.isArray(parsed.skill_breakdown)
      ? parsed.skill_breakdown
          .map((item) => item as Record<string, unknown>)
          .map((item, index) => {
            const rawValue = asFiniteNumber(item.value);
            const statusRaw = String(item.status ?? "no_data") as SkillStatus;
            const status: SkillStatus =
              statusRaw === "strong" ||
              statusRaw === "ok" ||
              statusRaw === "risk" ||
              statusRaw === "no_data"
                ? statusRaw
                : "no_data";
            return {
              key: String(item.key ?? `skill_${index}`),
              label: String(item.label ?? `Навык ${index + 1}`),
              status,
              value: rawValue == null ? null : Number(rawValue.toFixed(1)),
              comment: String(item.comment ?? statusComment(status, String(item.label ?? ""))),
            };
          })
          .slice(0, 8)
      : [],
    repeated_patterns: parseRiskItems(parsed.repeated_patterns, "repeated_patterns").slice(
      0,
      8,
    ),
    manager_notes: asStringArray(parsed.manager_notes).slice(0, 8),
    manager_risk_actions: parseManagerRiskActions(parsed.manager_risk_actions),
  };
}

function normalizeDate(value: string, endOfDay: boolean) {
  return `${value}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`;
}

/** ~150 слов/мин речи; длительность оценочная по транскрипту. */
function estimateDurationSecFromTranscript(transcript: string | null): number | null {
  const text = transcript?.trim();
  if (!text) return null;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 3) return null;
  return Math.round((words / 150) * 60);
}

type ReportCallInput = {
  id: string;
  date: string;
  score: number | null;
  duration_sec: number | null;
  positives: string[];
  negatives: string[];
  next_task: string | null;
  manager_id: string | null;
  manager_name: string;
};

function mapCallRowToInput(
  row: {
    id: string;
    score: number | null;
    transcript: string | null;
    positives: unknown;
    negatives: unknown;
    nextTask: string | null;
    createdAt: Date;
    managerId: string | null;
    manager: { id: string; name: string } | null;
  },
  fallbackManagerName: string,
): ReportCallInput {
  return {
    id: row.id,
    date: row.createdAt.toISOString().slice(0, 10),
    score: row.score,
    duration_sec: estimateDurationSecFromTranscript(row.transcript),
    positives: asStringArray(row.positives),
    negatives: asStringArray(row.negatives),
    next_task: row.nextTask?.trim() || null,
    manager_id: row.managerId,
    manager_name: row.manager?.name ?? fallbackManagerName,
  };
}

export const REPORT_SYSTEM_PROMPT = `Ты — Алекс Рэмси, директор по продажам с 20-летним опытом в B2B.
Ты лично вытащил 30+ отделов продаж из стагнации. Говоришь жёстко, по делу, без политесов.
Твои отчёты читают как приговор — и немедленно идут исправлять.

ФИЛОСОФИЯ АНАЛИЗА:
- Средний балл — ложь. Важно: растёт ли менеджер от звонка к звонку?
- Одна системная ошибка убивает конверсию сильнее, чем десять случайных.
- Если менеджер делает одно и то же неправильно 3+ раза — это не ошибка, это привычка.
  Привычки лечатся только drill-тренингом, не беседой.
- Лучший звонок команды — эталон. Остальные измеряются от него.

КАК АНАЛИЗИРОВАТЬ (порядок работы):
1. Сначала найди ЛУЧШИЙ звонок периода — опиши, что там было правильно.
2. Найди ХУДШИЙ паттерн — что повторяется у одного или нескольких менеджеров.
3. Определи: у кого ДИНАМИКА РОСТА (последние звонки лучше первых)?
   У кого ДЕГРАДАЦИЯ? У кого ПЛАТО (стабильно средне — это тоже проблема)?
4. Для каждого менеджера: одна главная точка роста — не список из 10 пунктов,
   а ОДНО самое важное, что изменит его результат.

СЛОВАРЬ risk_id (используй ТОЛЬКО эти ключи; если риск не подходит — other):
${formatRiskIdCatalogForPrompt()}

Ответ — строго валидный JSON (без markdown) по схеме:
{
  "average_score": number | null,
  "period_score": number | null,
  "summary": string,
  "repeated_patterns": [{ "risk_id": string, "text": string }],
  "manager_notes": string[],
  "coaching_focus": string[],
  "strengths": string[],
  "weaknesses": [{ "risk_id": string, "text": string }],
  "manager_risk_actions": {
    "[имя менеджера]": [
      { "risk_id": string, "risk": string, "actions": string[] }
    ]
  },
  "skill_breakdown": [
    { "key": string, "label": string, "status": "strong|ok|risk|no_data", "value": number | null, "comment": string }
  ]
}

СТРУКТУРА ПОЛЕЙ:

summary — «Общая картина»:
  Не «команда работает нормально». Скажи правду: растёт команда или деградирует,
  есть ли лидер, есть ли балласт. 2–3 предложения. Конкретные имена.

repeated_patterns — «Системные провалы периода»:
  Ровно 3 объекта { risk_id, text }. risk_id — ОБЯЗАТЕЛЬНО из словаря выше.
  text — русский текст: «🔴 [Название]: [Кто][Пример из звонка с датой][Почему это дорого стоит]».

manager_notes — «Разбор по менеджерам»:
  На КАЖДОГО менеджера из team_by_manager — ОДИН абзац, структура:
  «[Имя]: [Динамика: растёт/деградирует/плато]. Сильная сторона — [конкретно].
   Главная точка роста — [конкретно, с примером из звонков].
   Вердикт: [одно слово или короткая фраза — например: «Готов к росту»,
   «Нужен индивидуальный коучинг», «Риск потери клиентов»]»

coaching_focus — «План действий на следующую неделю»:
  Ровно 5 пунктов. Не абстрактных. Каждый начинается с глагола действия:
  «Провести...», «Разобрать...», «Поставить KPI...», «Слушать совместно...»
  Первые 2 — самое срочное (горит). Последние 2 — системное (на перспективу).

strengths — сильные стороны фокус-менеджера (focus_manager): 3–5 конкретных пунктов (string[]).

weaknesses — слабые стороны фокус-менеджера: 3–5 объектов { risk_id, text }.
  risk_id — ОБЯЗАТЕЛЬНО из словаря. text — конкретная формулировка на русском.

manager_risk_actions — «Что делать» по рискам:
  Для КАЖДОГО менеджера из team_by_manager: ТОП-3 риска, объекты { risk_id, risk, actions }.
  risk_id ДОЛЖЕН совпадать с risk_id в weaknesses / repeated_patterns для того же риска.
  actions: 2–3 пункта, глагол в начале, максимум 10 слов каждое.
  Пример:
  {
    "Иван": [
      {
        "risk_id": "price_objection_handling",
        "risk": "Не отрабатывает возражения по цене",
        "actions": [
          "Разобрать 3 звонка где клиент спросил про цену",
          "Отработать технику «цена-ценность» на ролевой игре",
          "Поставить KPI: называть цену первым в 80% звонков"
        ]
      }
    ]
  }

skill_breakdown — возьми переданный baseline и скорректируй comment по фактам из звонков.

ПРАВИЛА:
- Никакой воды, никакого «в целом неплохо».
- Если данных мало (< 3 звонков) — честно предупреди, но всё равно дай максимум из того, что есть.
- Выдуманные факты запрещены — только то, что есть в данных звонков (score, positives, negatives, next_task, date).
- Звонки без positives/negatives не используй для выводов о навыках; если их много — скажи прямо.
- Язык: русский, живой, профессиональный — не канцелярит, не чат-бот.`;

export function buildReportUserMessage(input: {
  companyName: string;
  periodFrom: string;
  periodTo: string;
  focusManagerId: string;
  focusManagerName: string;
  computedAvg: number | null;
  calls: ReportCallInput[];
  teamByManager: {
    manager_id: string;
    manager_name: string;
    calls_count: number;
    analyzed_count: number;
    avg_score: number | null;
    calls: ReportCallInput[];
  }[];
  analyzedCallsCount: number;
  skillBreakdown: SkillBreakdownItem[];
}): string {
  const focusCalls = input.calls;
  const teamSummary = input.teamByManager.map((m) => ({
    manager_id: m.manager_id,
    manager_name: m.manager_name,
    calls_count: m.calls_count,
    analyzed_count: m.analyzed_count,
    avg_score: m.avg_score,
  }));

  return `Сформируй коучинговый отчёт по данным ниже.

Допустимые risk_id (только из этого списка; иначе other):
${formatRiskIdCatalogForPrompt()}

Контекст:
- Компания: ${input.companyName}
- Период: ${input.periodFrom} — ${input.periodTo}
- Фокус-менеджер отчёта: ${input.focusManagerName} (id: ${input.focusManagerId})
- Средний балл фокус-менеджера (расчёт системы): ${input.computedAvg ?? "нет данных"}
- Звонков у фокус-менеджера: ${focusCalls.length}, с анализом: ${input.analyzedCallsCount}

Сводка по команде за период (для сравнения менеджеров):
${JSON.stringify(teamSummary, null, 2)}

Звонки фокус-менеджера (excluded=false; поля: score, positives[], negatives[], next_task, duration_sec — оценка по транскрипту):
${JSON.stringify(focusCalls, null, 2)}

Все звонки команды по менеджерам (для паттернов и сравнения; те же поля):
${JSON.stringify(
  input.teamByManager.map((m) => ({
    manager_id: m.manager_id,
    manager_name: m.manager_name,
    calls: m.calls,
  })),
  null,
  2,
)}

Базовый skill_breakdown (скопируй в ответ и уточни comment по фактам):
${JSON.stringify(input.skillBreakdown, null, 2)}`;
}

function providerErrorDetails(error: unknown): {
  status: number | null;
  code: string | null;
  message: string;
} {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      status?: unknown;
      code?: unknown;
      message?: unknown;
      error?: { code?: unknown; message?: unknown };
    };
    const status =
      typeof maybe.status === "number" && Number.isFinite(maybe.status)
        ? maybe.status
        : null;
    const code =
      typeof maybe.code === "string"
        ? maybe.code
        : typeof maybe.error?.code === "string"
          ? maybe.error.code
          : null;
    const message =
      typeof maybe.message === "string"
        ? maybe.message
        : typeof maybe.error?.message === "string"
          ? maybe.error.message
          : "Unknown provider error";
    return { status, code, message };
  }
  return {
    status: null,
    code: null,
    message: error instanceof Error ? error.message : String(error),
  };
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx?.user.companyId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    try {
      assertProductAccess(ctx.subscription);
    } catch (e) {
      if (isProductAccessDenied(e)) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const companyId = ctx.user.companyId;

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    const body = (await request.json()) as {
      managerId?: string;
      from?: string;
      to?: string;
    };

    const managerId = body.managerId?.trim();
    const from = body.from?.trim();
    const to = body.to?.trim();

    if (!managerId || !from || !to) {
      return NextResponse.json(
        { error: "Нужно указать менеджера и период" },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json({ error: "Некорректный диапазон дат" }, { status: 400 });
    }

    const [manager, company] = await Promise.all([
      prisma.manager.findFirst({
        where: { id: managerId, companyId, isActive: true },
        select: { id: true, name: true },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      }),
    ]);

    if (!manager) {
      return NextResponse.json(
        { error: "Менеджер не найден или нет доступа" },
        { status: 404 }
      );
    }

    const companyName = company?.name?.trim() || "Компания";
    const fromDate = new Date(normalizeDate(from, false));
    const toDate = new Date(normalizeDate(to, true));

    const callSelect = {
      id: true,
      score: true,
      transcript: true,
      positives: true,
      negatives: true,
      nextTask: true,
      createdAt: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    } as const;

    const [callsRaw, teamCallsRaw] = await Promise.all([
      prisma.call.findMany({
        where: {
          companyId,
          managerId,
          excluded: false,
          createdAt: { gte: fromDate, lte: toDate },
        },
        orderBy: { createdAt: "asc" },
        select: callSelect,
      }),
      prisma.call.findMany({
        where: {
          companyId,
          excluded: false,
          createdAt: { gte: fromDate, lte: toDate },
        },
        orderBy: { createdAt: "asc" },
        select: callSelect,
      }),
    ]);

    const calls = callsRaw.map((c) => mapCallRowToInput(c, manager.name));

    const scores = calls
      .map((c) => c.score)
      .filter((s): s is number => typeof s === "number" && Number.isFinite(s));
    const computedAvg =
      scores.length > 0
        ? Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1))
        : null;

    const allPositives = calls.flatMap((c) => asStringArray(c.positives));
    const allNegatives = calls.flatMap((c) => asStringArray(c.negatives));
    const analyzedCallsCount = calls.filter(
      (c) =>
        (typeof c.score === "number" && Number.isFinite(c.score)) ||
        c.positives.length > 0 ||
        c.negatives.length > 0,
    ).length;

    const teamByManagerMap = new Map<
      string,
      { manager_id: string; manager_name: string; calls: ReportCallInput[] }
    >();
    for (const row of teamCallsRaw) {
      const mid = row.managerId ?? row.manager?.id ?? "unknown";
      const mname = row.manager?.name ?? "Без менеджера";
      const bucket = teamByManagerMap.get(mid) ?? {
        manager_id: mid,
        manager_name: mname,
        calls: [],
      };
      bucket.calls.push(mapCallRowToInput(row, mname));
      teamByManagerMap.set(mid, bucket);
    }
    const teamByManager = Array.from(teamByManagerMap.values()).map((m) => {
      const scores = m.calls
        .map((c) => c.score)
        .filter((s): s is number => typeof s === "number" && Number.isFinite(s));
      const analyzed = m.calls.filter(
        (c) =>
          (typeof c.score === "number" && Number.isFinite(c.score)) ||
          c.positives.length > 0 ||
          c.negatives.length > 0,
      ).length;
      return {
        ...m,
        calls_count: m.calls.length,
        analyzed_count: analyzed,
        avg_score:
          scores.length > 0
            ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
            : null,
      };
    });
    const baseSkillBreakdown = computeSkillBreakdown(allPositives, allNegatives);

    const makeFallbackReport = (): ReportJson => {
      const repeatedPatterns = buildRepeatedPatternTitles(allNegatives, 5);
      const normalizedStrengths = buildTheses(allPositives, "strength", 5);
      const normalizedWeaknesses = buildTheses(allNegatives, "weakness", 5);
      const repeatedStrengths = normalizedStrengths.map((item) => stripRawSpeech(item));
      const weakSkills = baseSkillBreakdown.filter((skill) => skill.status === "risk");
      const midSkills = baseSkillBreakdown.filter((skill) => skill.status === "ok");
      const strongSkills = baseSkillBreakdown.filter((skill) => skill.status === "strong");
      const sampleIsSmall = analyzedCallsCount <= 2;

      let summary = "";
      if (calls.length === 0) {
        summary =
          "За выбранный период звонков нет, управленческий вывод по качеству продаж пока сделать нельзя. Стоит собрать хотя бы 3-5 звонков и пересобрать отчет. Пока фокус лучше держать на базовой дисциплине: структура звонка, фиксация следующего шага и работа с потребностью.";
      } else if (analyzedCallsCount === 0) {
        summary =
          "По текущей выборке звонки есть, но по ним нет полноценного анализа, поэтому выводы ограничены. Пока не видно устойчивого паттерна сильных и слабых сторон. Стоит сначала доразобрать звонки за период, чтобы руководителю опираться на факты, а не на предположения.";
      } else {
        const levelText =
          computedAvg == null
            ? "уровень менеджера по текущей выборке пока нельзя оценить в балле"
            : computedAvg >= 75
              ? `общий уровень по текущей выборке ближе к сильному (средний балл ${computedAvg})`
              : computedAvg >= 55
                ? `общий уровень по текущей выборке средний (средний балл ${computedAvg})`
                : `по текущей выборке видно, что общий уровень пока нестабилен (средний балл ${computedAvg})`;
        const betterText = repeatedStrengths.length
          ? `лучше всего проявлены: ${repeatedStrengths.slice(0, 2).join("; ")}`
          : "явно повторяющихся сильных сигналов пока немного";
        const reserveText = weakSkills.length
          ? `основной резерв роста сейчас в навыке: ${weakSkills
              .slice(0, 2)
              .map((skill) => skill.label)
              .join(", ")}`
          : "стоит обратить внимание на стабильность коммерческого завершения звонка и качество квалификации";
        summary = `${toSentence(levelText)} ${toSentence(betterText)} ${toSentence(reserveText)}`;
        if (sampleIsSmall) {
          summary += " Выборка пока небольшая, поэтому формулировки стоит считать предварительными.";
        }
      }

      const strengths: string[] = [];
      for (const item of normalizedStrengths.slice(0, 5)) {
        strengths.push(item);
      }
      for (const skill of strongSkills) {
        if (strengths.length >= 5) break;
        strengths.push(`${skill.label}: используется уверенно.`);
      }
      if (!strengths.length) {
        strengths.push(
          sampleIsSmall
            ? "Выборка пока небольшая, устойчивые сильные паттерны проявлены слабо."
            : "Пока не видно устойчивых повторяющихся сильных сигналов, стоит собрать больше данных."
        );
      }

      const weaknesses: ReportRiskItem[] = [];
      for (const item of normalizedWeaknesses.slice(0, 5)) {
        weaknesses.push(toRiskItem(item));
      }
      for (const skill of weakSkills) {
        if (weaknesses.length >= 5) break;
        weaknesses.push(
          toRiskItem(
            `${skill.label}: проявлено слабо, снижает конверсию.`,
            skill.key === "price" || skill.key === "objections"
              ? "price_objection_handling"
              : skill.key === "upsell"
                ? "upsell_missed"
                : skill.key === "competition"
                  ? "competitor_positioning_weak"
                  : skill.key === "qualification"
                    ? "discovery_shallow"
                    : skill.key === "closing"
                      ? "next_steps_unclear"
                      : "other",
          ),
        );
      }
      if (!weaknesses.length) {
        weaknesses.push(
          toRiskItem(
            sampleIsSmall
              ? "По ограниченному числу звонков критичных повторяющихся ошибок пока не видно."
              : "Явных повторяющихся коммерческих провалов немного, но нужно усилить стабильность ключевых этапов звонка.",
          ),
        );
      }

      const repeated_patterns: ReportRiskItem[] = repeatedPatterns.map((text) =>
        toRiskItem(text),
      );

      const coaching_focus: string[] = [];
      const focusCandidates = [...weakSkills, ...midSkills].slice(0, 3);
      for (const skill of focusCandidates) {
        coaching_focus.push(
          `${skill.label}: разобрать 2-3 звонка на встрече 1:1 и зафиксировать конкретный скрипт/чеклист применения на следующую неделю.`
        );
      }
      if (!coaching_focus.length) {
        coaching_focus.push(
          "Сфокусироваться на структуре звонка: цель клиента -> квалификация -> предложение -> следующий шаг."
        );
      }
      coaching_focus.splice(3);

      const manager_notes: string[] = [];
      manager_notes.push(
        sampleIsSmall
          ? "Выборка пока небольшая: решения по развитию лучше сверять на следующей неделе по новым звонкам."
          : "Повторяющиеся паттерны уже видны, их можно брать в план 1:1 без перегруза деталями."
      );
      manager_notes.push(
        analyzedCallsCount < calls.length
          ? "Часть звонков без анализа: итог отчета предварительный, стоит догрузить разборы для более точной картины."
          : "Отчет собран по звонкам с анализом, данные подходят для регулярной управленческой встречи."
      );
      manager_notes.push(
        "Если company_profile заполнен частично или пусто, выводы по УТП, допродажам и продуктовой подаче считаем осторожными, без финальных выводов."
      );
      if (weakSkills.length > 0) {
        manager_notes.push(
          `Главный риск периода: ${weakSkills
            .slice(0, 2)
            .map((skill) => skill.label)
            .join(", ")}. Лучше выбрать 1-2 навыка и проверить прогресс по факту в следующем отчете.`
        );
      }
      manager_notes.splice(4);

      return {
        average_score: computedAvg,
        period_score: computedAvg,
        summary,
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5),
        coaching_focus,
        skill_breakdown: baseSkillBreakdown,
        repeated_patterns: repeated_patterns.slice(0, 3),
        manager_notes,
        manager_risk_actions: {},
      };
    };

    if (calls.length === 0) {
      const report = makeFallbackReport();
      return NextResponse.json({
        report: {
          ...report,
          managerName: manager.name,
          callsCount: 0,
          analyzedCallsCount,
          from,
          to,
        },
      });
    }

    const userMessage = buildReportUserMessage({
      companyName,
      periodFrom: from,
      periodTo: to,
      focusManagerId: manager.id,
      focusManagerName: manager.name,
      computedAvg,
      calls,
      teamByManager,
      analyzedCallsCount,
      skillBreakdown: baseSkillBreakdown,
    });
    const fallbackReport = makeFallbackReport();
    let report: ReportJson = fallbackReport;

    if (!apiKey) {
      console.warn("[reports/generate] OPENAI_API_KEY is missing, using fallback report");
    } else {
      const openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      });

      try {
        const completion = await openai.chat.completions.create({
          model: "meta-llama/llama-3.3-70b-instruct",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: REPORT_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        });

        const rawJson = completion.choices?.[0]?.message?.content;
        if (!rawJson) {
          console.warn("[reports/generate] Empty provider response, using fallback report");
        } else {
          try {
            report = parseReportJson(rawJson);
          } catch {
            console.warn("[reports/generate] Failed to parse provider JSON, using fallback report");
          }
        }
      } catch (providerError) {
        const details = providerErrorDetails(providerError);
        console.error("[reports/generate] AI provider error", {
          status: details.status,
          code: details.code,
          message: details.message,
        });
        report = fallbackReport;
      }
    }

    const normalizedReport: ReportJson = {
      ...report,
      average_score: report.average_score ?? computedAvg,
      period_score: report.period_score ?? report.average_score ?? computedAvg,
      summary: report.summary || fallbackReport.summary,
      strengths: report.strengths.length ? report.strengths : fallbackReport.strengths,
      weaknesses: report.weaknesses.length ? report.weaknesses : fallbackReport.weaknesses,
      coaching_focus: report.coaching_focus.length
        ? report.coaching_focus
        : fallbackReport.coaching_focus,
      skill_breakdown: report.skill_breakdown.length
        ? report.skill_breakdown
        : baseSkillBreakdown,
      repeated_patterns: report.repeated_patterns.length
        ? report.repeated_patterns
        : fallbackReport.repeated_patterns,
      manager_notes: report.manager_notes.length
        ? report.manager_notes
        : fallbackReport.manager_notes,
      manager_risk_actions:
        Object.keys(report.manager_risk_actions).length > 0
          ? report.manager_risk_actions
          : fallbackReport.manager_risk_actions,
    };

    return NextResponse.json({
      report: {
        ...normalizedReport,
        managerName: manager.name,
        callsCount: calls.length,
        analyzedCallsCount,
        from,
        to,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка генерации отчёта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
