import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function getUserIdFromRequest(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  } as never);

  return token?.sub ?? null;
}
