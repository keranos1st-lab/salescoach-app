export type CompanyProfile = {
  id: string;
  user_id: string;
  site_url: string | null;
  parsed_text: string | null;
  manual_description: string | null;
  niche: string | null;
  services: string[] | null;
  products: string[] | null;
  regions: string[] | null;
  min_check: number | null;
  avg_check: number | null;
  priority_clients: string | null;
  unique_selling_points: string[] | null;
  upsell_services: string[] | null;
  anti_ideal_clients: string | null;
  updated_at: string | null;
};

function jsonbStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  const out = value.map((v) => String(v)).filter(Boolean);
  return out.length ? out : null;
}

function nullableInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Профиль по умолчанию, если строки в БД ещё нет */
export function emptyCompanyProfile(userId: string): CompanyProfile {
  return {
    id: "",
    user_id: userId,
    site_url: null,
    parsed_text: null,
    manual_description: null,
    niche: null,
    services: null,
    products: null,
    regions: null,
    min_check: null,
    avg_check: null,
    priority_clients: null,
    unique_selling_points: null,
    upsell_services: null,
    anti_ideal_clients: null,
    updated_at: null,
  };
}

/** Маппинг строки из Supabase в CompanyProfile */
export function rowToCompanyProfile(
  row: Record<string, unknown>,
  fallbackUserId: string
): CompanyProfile {
  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? fallbackUserId),
    site_url: row.site_url != null ? String(row.site_url) : null,
    parsed_text: row.parsed_text != null ? String(row.parsed_text) : null,
    manual_description:
      row.manual_description != null ? String(row.manual_description) : null,
    niche: row.niche != null ? String(row.niche) : null,
    services: jsonbStringArray(row.services),
    products: jsonbStringArray(row.products),
    regions: jsonbStringArray(row.regions),
    min_check: nullableInt(row.min_check),
    avg_check: nullableInt(row.avg_check),
    priority_clients:
      row.priority_clients != null ? String(row.priority_clients) : null,
    unique_selling_points: jsonbStringArray(row.unique_selling_points),
    upsell_services: jsonbStringArray(row.upsell_services),
    anti_ideal_clients:
      row.anti_ideal_clients != null ? String(row.anti_ideal_clients) : null,
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}
