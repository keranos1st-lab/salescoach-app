import { AppShell } from "@/components/app-shell";
import {
  companyProfileFromJson,
  emptyCompanyProfile,
  type CompanyProfile,
} from "@/lib/company-profile";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import { ProductWorkspace } from "./product-workspace";
import { redirect } from "next/navigation";

export type { CompanyProfile };

export default async function ProductPage() {
  const ctx = await getAuthContext();
  if (!ctx?.user.companyId) {
    redirect("/login");
  }

  const userId = ctx.user.id;
  const companyId = ctx.user.companyId;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { profile: true },
  });

  const initialProfile = company?.profile
    ? companyProfileFromJson(company.profile, userId)
    : emptyCompanyProfile(userId);

  return (
    <AppShell activeHref="/product">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <ProductWorkspace initialProfile={initialProfile} />
      </main>
    </AppShell>
  );
}
