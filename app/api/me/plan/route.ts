import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/get-auth-context";

/** Current subscription `Plan` for session user — for client hydration (e.g. pricing badge), not blocking RSC. */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    const plan = ctx?.subscription?.plan ?? null;
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ plan: null });
  }
}
