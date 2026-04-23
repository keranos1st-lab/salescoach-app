export type CompanyProfileResponse = {
  niche: string | null;
  services: string[];
  products: string[];
  regions: string[];
  min_check: number | null;
  avg_check: number | null;
  priority_clients: string | null;
  unique_selling_points: string[];
  upsell_services: string[];
  anti_ideal_clients: string | null;
};

export type CallAnalysisResponse = {
  script_following: number;
  objection_handling: number;
  tone_and_rapport: number;
  next_step_clarity: number;
  upsell_attempts: number;
  competitor_differentiation: number;
  summary: string;
  mistakes: string[];
  good_points: string[];
};

function clampScore0to10(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

export function normalizeCompanyProfileResponse(
  raw: Record<string, unknown>
): CompanyProfileResponse {
  const numOrNull = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const strOrNull = (v: unknown): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };

  return {
    niche: strOrNull(raw.niche),
    services: stringArray(raw.services),
    products: stringArray(raw.products),
    regions: stringArray(raw.regions),
    min_check: numOrNull(raw.min_check),
    avg_check: numOrNull(raw.avg_check),
    priority_clients: strOrNull(raw.priority_clients),
    unique_selling_points: stringArray(raw.unique_selling_points),
    upsell_services: stringArray(raw.upsell_services),
    anti_ideal_clients: strOrNull(raw.anti_ideal_clients),
  };
}

export function normalizeCallAnalysisResponse(
  raw: Record<string, unknown>
): CallAnalysisResponse {
  return {
    script_following: clampScore0to10(raw.script_following),
    objection_handling: clampScore0to10(raw.objection_handling),
    tone_and_rapport: clampScore0to10(raw.tone_and_rapport),
    next_step_clarity: clampScore0to10(raw.next_step_clarity),
    upsell_attempts: clampScore0to10(raw.upsell_attempts),
    competitor_differentiation: clampScore0to10(raw.competitor_differentiation),
    summary: typeof raw.summary === "string" ? raw.summary : String(raw.summary ?? ""),
    mistakes: stringArray(raw.mistakes),
    good_points: stringArray(raw.good_points),
  };
}
