import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;
export const preferredRegion = "iad1";

type ReportJson = {
  average_score: number | null;
  period_score: number | null;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  coaching_focus: string[];
  skill_breakdown: SkillBreakdownItem[];
  repeated_patterns: string[];
  manager_notes: string[];
};

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
    weaknesses: asStringArray(parsed.weaknesses).slice(0, 6),
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
    repeated_patterns: asStringArray(parsed.repeated_patterns).slice(0, 8),
    manager_notes: asStringArray(parsed.manager_notes).slice(0, 8),
  };
}

function normalizeDate(value: string, endOfDay: boolean) {
  return `${value}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`;
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

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

    const { data: manager } = await supabase
      .from("managers")
      .select("id, name")
      .eq("id", managerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!manager) {
      return NextResponse.json(
        { error: "Менеджер не найден или нет доступа" },
        { status: 404 }
      );
    }

    const { data: callsRaw } = await supabase
      .from("calls")
      .select("score, positives, negatives, created_at")
      .eq("manager_id", managerId)
      .gte("created_at", normalizeDate(from, false))
      .lte("created_at", normalizeDate(to, true))
      .order("created_at", { ascending: true });

    const calls = callsRaw ?? [];

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
        asStringArray(c.positives).length > 0 ||
        asStringArray(c.negatives).length > 0
    ).length;
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

      const weaknesses: string[] = [];
      for (const item of normalizedWeaknesses.slice(0, 5)) {
        weaknesses.push(item);
      }
      for (const skill of weakSkills) {
        if (weaknesses.length >= 5) break;
        weaknesses.push(`${skill.label}: проявлено слабо, снижает конверсию.`);
      }
      if (!weaknesses.length) {
        weaknesses.push(
          sampleIsSmall
            ? "По ограниченному числу звонков критичных повторяющихся ошибок пока не видно."
            : "Явных повторяющихся коммерческих провалов немного, но нужно усилить стабильность ключевых этапов звонка."
        );
      }

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
        repeated_patterns: repeatedPatterns,
        manager_notes,
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

    const prompt = `Ты руководитель отдела продаж. Подготовь управленческий executive report по менеджеру ${
      manager.name
    } за период ${from} - ${to}. Верни JSON строго по схеме:
{
  "average_score": number | null,
  "period_score": number | null,
  "summary": "короткий управленческий вывод",
  "strengths": string[],
  "weaknesses": string[],
  "coaching_focus": string[],
  "skill_breakdown": [
    { "key": "usp|upsell|competition|qualification|price|objections|closing|product_context", "label": string, "status": "strong|ok|risk|no_data", "value": number | null, "comment": string }
  ],
  "repeated_patterns": string[],
  "manager_notes": string[]
}

Правила:
- Пиши только на русском.
- Пиши простым русским языком, без канцелярита.
- Дай управленческий тон и решения для 1:1, но честно по данным.
- Учитывай, что часть звонков может быть без анализа.
- Не придумывай факты про УТП, допродажи и отстройку от конкурентов, если сигналов мало.
- При слабых сигналах используй осторожные формулировки: "по текущей выборке видно", "стоит обратить внимание", "пока не видно устойчивого использования", "в текущих звонках это проявлено слабо".
- summary: 2-3 предложения (общий уровень, что лучше получается, где резерв роста).
- strengths: максимум 3-5 пунктов, только повторяющиеся сильные сигналы.
- weaknesses: упор на коммерческие упущения; если данных мало, формулируй мягко.
- coaching_focus: 2-3 практичных задач для руководителя.
- manager_notes: 2-4 коротких наблюдения для руководителя, без повтора strengths/weaknesses.
- Если звонков мало, отмечай ограниченность выборки.
- Если company_profile пустой или неполный, не делай категоричных выводов по продуктовой части.
- Никакого markdown, только валидный JSON.

Входные данные:
- Количество звонков: ${calls.length}
- Количество звонков с анализом: ${analyzedCallsCount}
- Менеджер: ${manager.name}
- Период: ${from} - ${to}
- Подсчитанный средний балл: ${computedAvg ?? "нет данных"}
- Сильные стороны из звонков: ${JSON.stringify(allPositives)}
- Зоны роста из звонков: ${JSON.stringify(allNegatives)}
- Базовый навыковый срез: ${JSON.stringify(baseSkillBreakdown)}`;
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
            {
              role: "system",
              content:
                "Отвечай только валидным JSON-объектом на русском языке, без markdown.",
            },
            { role: "user", content: prompt },
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
