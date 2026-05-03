import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-клиент с JWT Clerk в Authorization (для PostgREST RLS как у залогиненного пользователя).
 * Если в Clerk создан JWT template для Supabase, задайте CLERK_SUPABASE_JWT_TEMPLATE (например supabase).
 */
export async function createClerkSupabaseClient() {
  const { getToken } = await auth();
  const template = process.env.CLERK_SUPABASE_JWT_TEMPLATE?.trim();
  const token = template
    ? await getToken({ template })
    : await getToken();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY в .env.local"
    );
  }

  if (!token) {
    throw new Error(
      "Нет Clerk session token для Supabase. Войдите в систему или настройте JWT для Supabase в Clerk."
    );
  }

  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
