import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("[nextauth env]", {
  hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
  hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
