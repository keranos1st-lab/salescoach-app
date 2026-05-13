/* Temporarily disabled — Next.js ignores this filename. Rename to `proxy.ts` to re-enable.
   See commit message / incident: ERR_CONNECTION_RESET on prod. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Session JWT cookie naming must match NextAuth (see lib/auth.ts; no custom `cookies.sessionToken` yet).
 * Optional override: NEXTAUTH_SESSION_COOKIE=same-as-nextauth-config
 *
 * IMPORTANT: NEXTAUTH_SECRET in Vercel → Settings → Environment Variables must match `.env`
 * locally, or JWT decode fails and `getToken` returns null → redirect loop to `/login`.
 */
function getSessionTokenReadOptions() {
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
    process.env.VERCEL === "1";

  const cookieName =
    process.env.NEXTAUTH_SESSION_COOKIE?.trim() ||
    (secureCookie
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token");

  return { secureCookie, cookieName };
}

/** Public routes (proxy may run if matcher expands; `/` handled explicitly — never use startsWith("/").) */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/favicon.ico") return true;

  const prefixes = [
    "/login",
    "/register",
    "/pricing",
    "/trial-expired",
    "/api/auth",
    "/api/payments",
    "/_next",
  ] as const;

  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const { secureCookie, cookieName } = getSessionTokenReadOptions();

  const token = await getToken({
    req: request,
    secret,
    secureCookie,
    cookieName,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
