import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/trial-expired") ||
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/auth")
  );
}

function isSubscriptionBlocked(token: {
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
}) {
  if (token.subscriptionStatus === "expired") return true;
  if (
    token.subscriptionStatus === "trial" &&
    token.trialEndsAt &&
    new Date(token.trialEndsAt) < new Date()
  ) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isSubscriptionBlocked(token)) {
    return NextResponse.redirect(new URL("/trial-expired", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/protected/:path*",
  ],
};
