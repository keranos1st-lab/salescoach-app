import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/get-auth-context";

/** Current subscription plan for the session user — on demand only (e.g. pricing Buy click). */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ authenticated: false, plan: null });
  }
  const plan = ctx.subscription?.plan ?? null;
  return NextResponse.json({ authenticated: true, plan });
}
