import { createClient } from "@supabase/supabase-js";

/** Серверный клиент Supabase с service role (обход RLS) для Storage и прочих серверных операций. */
export function createSupabaseServiceClient() {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = rawKey?.trim();

  console.log("[supabase-service] env diagnostics (no secrets)", {
    supabaseServiceRoleKeyRawLength: rawKey?.length ?? 0,
    supabaseServiceRoleKeyTrimmedLength: key?.length ?? 0,
    supabaseStorageCallsBucketJson: JSON.stringify(
      process.env.SUPABASE_STORAGE_CALLS_BUCKET ?? null
    ),
  });

  if (!url || !key) {
    throw new Error(
      "Задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local для загрузки файлов в Storage."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
