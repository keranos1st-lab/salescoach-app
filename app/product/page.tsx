import { AppShell } from "@/components/app-shell";
import {
  emptyCompanyProfile,
  rowToCompanyProfile,
  type CompanyProfile,
} from "@/lib/company-profile";
import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { ProductWorkspace } from "@/app/product/product-workspace";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type { CompanyProfile };

export default async function ProductPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClerkSupabaseClient();

  const { data: profile } = await supabase
    .from("company_profile")
    .select(
      "id, user_id, site_url, parsed_text, manual_description, niche, services, products, regions, min_check, avg_check, priority_clients, unique_selling_points, upsell_services, anti_ideal_clients, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const initialProfile: CompanyProfile = profile
    ? rowToCompanyProfile(profile as unknown as Record<string, unknown>, userId)
    : emptyCompanyProfile(userId);

  return (
    <AppShell activeHref="/product">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <ProductWorkspace initialProfile={initialProfile} />
      </main>
    </AppShell>
  );
}
