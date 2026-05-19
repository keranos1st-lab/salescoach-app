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

/** Цвета линий на графике тренда рисков (дашборд). */
export const RISK_CHART_COLORS: Record<string, string> = {
  price_objection_handling: "#ef4444",
  upsell_missed: "#f97316",
  competitor_positioning_weak: "#eab308",
  discovery_shallow: "#f59e0b",
  next_steps_unclear: "#dc2626",
  script_structure_weak: "#a855f7",
  rapport_weak: "#8b5cf6",
  talk_ratio_high: "#6366f1",
  followup_missing: "#ec4899",
  other: "#71717a",
};

const RISK_CHART_FALLBACK_PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#14b8a6",
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
  "#3b82f6",
  "#f97316",
];

export function riskChartColor(riskId: string, index: number): string {
  return RISK_CHART_COLORS[normalizeRiskId(riskId)] ?? RISK_CHART_FALLBACK_PALETTE[index % RISK_CHART_FALLBACK_PALETTE.length];
}

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

export function riskLabel(riskId: string): string {
  return RISK_LABELS[riskId] ?? RISK_LABELS.other;
}

export type ManagerRiskAction = {
  risk_id: string;
  risk: string;
  actions: string[];
};

export type ManagerRiskActionsMap = Record<string, ManagerRiskAction[]>;

const DEFAULT_ACTIONS: Record<string, string[]> = {
  price_objection_handling: [
    "Разобрать 3 звонка с возражениями по цене",
    "Отработать технику «цена-ценность» на ролевой",
    "Поставить KPI: называть цену первым в 80% звонков",
  ],
  upsell_missed: [
    "Разобрать звонки без предложения допуслуг",
    "Составить скрипт допродажи на 1:1",
    "Поставить KPI: 1 допродажа в 3 звонках",
  ],
  competitor_positioning_weak: [
    "Разобрать 2 звонка с упоминанием конкурентов",
    "Зафиксировать 3 тезиса отстройки в скрипте",
    "Проверить применение на следующих 5 звонках",
  ],
  discovery_shallow: [
    "Разобрать звонки без вопросов о потребности",
    "Внедрить чеклист квалификации на 1:1",
    "Слушать совместно 2 звонка с разбором",
  ],
  next_steps_unclear: [
    "Разобрать звонки без фиксации следующего шага",
    "Отработать закрытие с датой и временем",
    "Поставить KPI: 90% звонков с чётким next step",
  ],
  script_structure_weak: [
    "Разобрать 2 звонка с хаотичной структурой",
    "Пройти скрипт этапов звонка на тренировке",
    "Слушать 3 звонка подряд с чеклистом",
  ],
  rapport_weak: [
    "Разобрать звонки с формальным тоном",
    "Отработать вход в разговор на ролевой",
    "Слушать 2 лучших звонка коллеги как эталон",
  ],
  talk_ratio_high: [
    "Посчитать долю речи менеджера в 3 звонках",
    "Внедрить правило: вопрос после каждого блока",
    "Слушать совместно 1 звонок с паузами",
  ],
  followup_missing: [
    "Разобрать звонки без договорённости о контакте",
    "Зафиксировать шаблон завершения звонка",
    "Проверить follow-up в CRM за неделю",
  ],
  other: [
    "Разобрать 2–3 проблемных звонка на 1:1",
    "Зафиксировать 1 навык на неделю",
    "Переслушать звонки через 5 дней",
  ],
};

export function defaultActionsForRiskId(riskId: string): string[] {
  return DEFAULT_ACTIONS[normalizeRiskId(riskId)] ?? DEFAULT_ACTIONS.other;
}

function resolveManagerKey(
  map: ManagerRiskActionsMap,
  managerName: string,
): string {
  const trimmed = managerName.trim();
  if (map[trimmed]?.length) return trimmed;
  const found = Object.keys(map).find(
    (k) => k.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return found ?? trimmed;
}

/** Дополняет manager_risk_actions, чтобы у каждого risk_id из отчёта были actions. */
export function enrichManagerRiskActions(
  focusManagerName: string,
  weaknesses: ReportRiskItem[],
  repeatedPatterns: ReportRiskItem[],
  incoming: ManagerRiskActionsMap,
): ManagerRiskActionsMap {
  const key = resolveManagerKey(incoming, focusManagerName);
  const byId = new Map<string, ManagerRiskAction>();

  for (const entry of incoming[key] ?? []) {
    if (entry.risk_id && entry.actions.length > 0) {
      byId.set(normalizeRiskId(entry.risk_id), {
        risk_id: normalizeRiskId(entry.risk_id),
        risk: entry.risk?.trim() || riskLabel(entry.risk_id),
        actions: entry.actions.slice(0, 3),
      });
    }
  }

  for (const item of [...weaknesses, ...repeatedPatterns]) {
    const riskId = normalizeRiskId(item.risk_id);
    if (byId.has(riskId)) continue;
    byId.set(riskId, {
      risk_id: riskId,
      risk: item.text,
      actions: defaultActionsForRiskId(riskId),
    });
  }

  return {
    ...incoming,
    [focusManagerName.trim()]: Array.from(byId.values()).slice(0, 6),
  };
}

/** Уникальные risk_id звонка (negatives + эвристика next_task + analysisJson.risks). */
export function extractCallRiskIds(
  negatives: unknown,
  nextTask?: string | null,
  analysisJson?: unknown,
): string[] {
  const ids = new Set<string>();
  for (const item of parseRiskItems(negatives)) {
    ids.add(item.risk_id);
  }
  const next = nextTask?.trim();
  if (next && /нет следующего|не зафиксир|размыт/i.test(next)) {
    ids.add("next_steps_unclear");
  }
  if (analysisJson && typeof analysisJson === "object" && !Array.isArray(analysisJson)) {
    const row = analysisJson as Record<string, unknown>;
    const raw = row.risks ?? row.risk_ids;
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (typeof entry === "string") {
          ids.add(normalizeRiskId(entry));
        } else if (typeof entry === "object" && entry !== null) {
          const r = entry as Record<string, unknown>;
          if (r.risk_id != null) ids.add(normalizeRiskId(r.risk_id));
        }
      }
    }
  }
  return Array.from(ids);
}

export function parseRiskItems(
  value: unknown,
  fieldName?: string,
): ReportRiskItem[] {
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

  if (legacyFormat && fieldName && process.env.NODE_ENV === "development") {
    console.warn(
      `[reports] Legacy string[] for ${fieldName}; mapped via inferRiskIdFromText`,
      result,
    );
  }

  if (fieldName && process.env.NODE_ENV === "development" && result.length) {
    console.log(`[reports] parseRiskItems(${fieldName}):`, result);
  }

  return result;
}

export function parseManagerRiskActions(value: unknown): ManagerRiskActionsMap {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const result: ManagerRiskActionsMap = {};
  for (const [managerName, entries] of Object.entries(value)) {
    if (!Array.isArray(entries)) continue;
    const parsed: ManagerRiskAction[] = [];
    for (const entry of entries.slice(0, 6)) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      const actions = asStringArray(row.actions).slice(0, 3);
      if (actions.length === 0) continue;
      const riskId = row.risk_id
        ? normalizeRiskId(row.risk_id)
        : inferRiskIdFromText(
            typeof row.risk === "string"
              ? row.risk
              : typeof row.text === "string"
                ? row.text
                : "",
          );
      const risk =
        (typeof row.risk === "string" ? row.risk.trim() : "") ||
        (typeof row.text === "string" ? row.text.trim() : "") ||
        riskLabel(riskId);
      parsed.push({ risk_id: riskId, risk, actions });
    }
    if (parsed.length > 0) {
      result[managerName.trim()] = parsed;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[reports] parseManagerRiskActions:", result);
  }

  return result;
}
