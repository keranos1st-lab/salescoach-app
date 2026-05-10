import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      companyId: string;
      plan?: string;
      subscriptionStatus?: string;
      trialEndsAt?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    plan?: string;
    companyId?: string;
    subscriptionStatus?: string;
    trialEndsAt?: Date | string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    plan?: string;
    companyId?: string;
    subscriptionStatus?: string;
    trialEndsAt?: string | null;
  }
}
