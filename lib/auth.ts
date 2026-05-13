import type { NextAuthOptions } from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        });

        if (user && user.passwordHash) {
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId ?? "",
              subscriptionStatus: user.subscriptionStatus,
              trialEndsAt: user.trialEndsAt,
            } satisfies NextAuthUser & { companyId: string };
          }
        }

        const manager = await prisma.manager.findUnique({
          where: { email: credentials.email },
          include: {
            company: { include: { subscription: true } },
          },
        });

        if (
          manager &&
          manager.isActive &&
          manager.email &&
          manager.passwordHash
        ) {
          const isValid = await bcrypt.compare(
            credentials.password,
            manager.passwordHash
          );
          if (isValid) {
            const subscription = manager.company.subscription;
            const subscriptionStatus =
              subscription?.status === "ACTIVE"
                ? "active"
                : subscription?.status === "TRIAL"
                  ? "trial"
                  : subscription
                    ? "expired"
                    : "trial";

            return {
              id: manager.id,
              email: manager.email,
              name: manager.name,
              role: "MANAGER",
              companyId: manager.companyId,
              subscriptionStatus,
              trialEndsAt: subscription?.trialEndsAt ?? null,
            } satisfies NextAuthUser & { companyId: string };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as NextAuthUser & { role?: string }).role;
        token.companyId = (user as NextAuthUser & { companyId?: string })
          .companyId;
        token.subscriptionStatus = user.subscriptionStatus;
        const raw = user.trialEndsAt;
        token.trialEndsAt =
          raw == null
            ? null
            : typeof raw === "string"
              ? raw
              : raw.toISOString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.id as string | undefined) ?? token.sub ?? "";
        session.user.role = token.role as string;
        session.user.companyId = (token.companyId as string) ?? "";
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.trialEndsAt = token.trialEndsAt ?? null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  ...(process.env.NEXTAUTH_SESSION_COOKIE
    ? {
        cookies: {
          sessionToken: {
            name: process.env.NEXTAUTH_SESSION_COOKIE,
            options: {
              httpOnly: true,
              sameSite: "lax" as const,
              path: "/",
              secure:
                process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
                process.env.VERCEL === "1",
            },
          },
        },
      }
    : {}),
};
