import { getAuthContext } from "@/lib/get-auth-context";
import {
  companyProfileFromJson,
  companyProfileToJson,
  type CompanyProfile,
} from "@/lib/company-profile";
import {
  mergeAutofillWithExisting,
  parseSiteTextToProfile,
} from "@/lib/product-profile-autofill";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function parseOptionalInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx?.user.companyId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const companyId = ctx.user.companyId;
    const userId = ctx.user.id;

    const body = (await request.json()) as {
      siteUrl?: string | null;
      parsedText?: string | null;
      manualDescription?: string | null;
      niche?: string | null;
      services?: string[] | null;
      products?: string[] | null;
      regions?: string[] | null;
      minCheck?: number | null;
      avgCheck?: number | null;
      priorityClients?: string | null;
      uniqueSellingPoints?: string[] | null;
      upsellServices?: string[] | null;
      antiIdealClients?: string | null;
      autoParse?: boolean;
    };

    const siteUrl = body.siteUrl?.trim() || null;
    const parsedText = body.parsedText?.trim() || null;
    const manualDescription = body.manualDescription?.trim() || null;
    const niche = body.niche?.trim() || null;
    const services = body.services?.length ? body.services : null;
    const products = body.products?.length ? body.products : null;
    const regions = body.regions?.length ? body.regions : null;
    const min_check = parseOptionalInt(body.minCheck);
    const avg_check = parseOptionalInt(body.avgCheck);
    const priority_clients = body.priorityClients?.trim() || null;
    const unique_selling_points = body.uniqueSellingPoints?.length
      ? body.uniqueSellingPoints
      : null;
    const upsell_services = body.upsellServices?.length
      ? body.upsellServices
      : null;
    const anti_ideal_clients = body.antiIdealClients?.trim() || null;
    const autoParse = body.autoParse === true;

    const companyRow = await prisma.company.findUnique({
      where: { id: companyId },
      select: { profile: true },
    });
    const existingProfile = companyProfileFromJson(
      companyRow?.profile ?? null,
      userId
    );

    let mergedNiche = niche;
    let mergedServices = services;
    let mergedProducts = products;
    let mergedManualDescription = manualDescription;

    if (autoParse && parsedText) {
      const parsedDraft = parseSiteTextToProfile(parsedText);
      const safeAutofill = mergeAutofillWithExisting(
        {
          niche: niche ?? existingProfile.niche ?? null,
          services: services ?? existingProfile.services ?? null,
          products: products ?? existingProfile.products ?? null,
          manual_description:
            manualDescription ?? existingProfile.manual_description ?? null,
        },
        parsedDraft
      );

      mergedNiche = niche ?? safeAutofill.niche;
      mergedServices = services ?? safeAutofill.services;
      mergedProducts = products ?? safeAutofill.products;
      mergedManualDescription =
        manualDescription ?? safeAutofill.manual_description;
    }

    const nextProfile: CompanyProfile = {
      ...existingProfile,
      user_id: userId,
      site_url: siteUrl,
      parsed_text: parsedText,
      manual_description: mergedManualDescription,
      niche: mergedNiche,
      services: mergedServices,
      products: mergedProducts,
      regions,
      min_check,
      avg_check,
      priority_clients,
      unique_selling_points,
      upsell_services,
      anti_ideal_clients,
      updated_at: new Date().toISOString(),
    };

    await prisma.company.update({
      where: { id: companyId },
      data: {
        profile: companyProfileToJson(nextProfile) as object,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
