import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth";
import {
  emptyCompanyProfile,
  rowToCompanyProfile,
  type CompanyProfile,
} from "@/lib/company-profile";
import { createClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProductWorkspace } from "@/app/product/product-workspace";

export type { CompanyProfile };

export default async function ProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("company_profile")
    .select(
      "id, user_id, site_url, parsed_text, manual_description, niche, services, products, regions, min_check, avg_check, priority_clients, unique_selling_points, upsell_services, anti_ideal_clients, updated_at"
    )
    .eq("user_id", session.user.id)
    .maybeSingle();

  const initialProfile: CompanyProfile = profile
    ? rowToCompanyProfile(profile as unknown as Record<string, unknown>, session.user.id)
    : emptyCompanyProfile(session.user.id);

  return (
    <AppShell activeHref="/product">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <ProductWorkspace initialProfile={initialProfile} />
      </main>
    </AppShell>
  );
}
