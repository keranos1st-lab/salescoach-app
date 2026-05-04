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
            } satisfies NextAuthUser & { companyId: string };
          }
        }

        const manager = await prisma.manager.findUnique({
          where: { email: credentials.email },
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
            return {
              id: manager.id,
              email: manager.email,
              name: manager.name,
              role: "MANAGER",
              companyId: manager.companyId,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.id as string | undefined) ?? token.sub ?? "";
        session.user.role = token.role as string;
        session.user.companyId = (token.companyId as string) ?? "";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
