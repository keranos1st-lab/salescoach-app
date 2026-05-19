export const RISK_LABELS: Record<string, string> = {
  price_objection_handling: "Возражения по цене",
  upsell_missed: "Допродажи не используются",
  competitor_positioning_weak: "Слабая отстройка от конкурентов",
  discovery_shallow: "Поверхностное выявление потребностей",
  next_steps_unclear: "Нет чёткого следующего шага",
  script_structure_weak: "Слабая структура разговора",
  rapport_weak: "Слабый контакт с клиентом",
  talk_ratio_high: "Говорит больше чем слушает",
  followup_missing: "Нет договорённости о продолжении",
  other: "Прочие риски",
};

export const REPORT_RISK_IDS = Object.keys(RISK_LABELS);

export type ReportRiskItem = {
  risk_id: string;
  text: string;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeRiskId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";
  return id in RISK_LABELS ? id : "other";
}

export function inferRiskIdFromText(text: string): string {
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

export function toRiskItem(text: string, riskId?: string): ReportRiskItem {
  const trimmed = text.trim();
  return {
    risk_id: riskId ? normalizeRiskId(riskId) : inferRiskIdFromText(trimmed),
    text: trimmed,
  };
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((v) => v.trim()).filter(Boolean);
}

/** Извлекает ReportRiskItem из JSON weaknesses/repeated_patterns или строк. */
export function parseRiskItems(value: unknown): ReportRiskItem[] {
  if (!Array.isArray(value)) return [];

  const result: ReportRiskItem[] = [];
  for (const item of value) {
    if (typeof item === "string") {
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
  return result;
}

export function riskLabel(riskId: string): string {
  return RISK_LABELS[riskId] ?? RISK_LABELS.other;
}
