import { createClient } from "@/lib/supabase-server";
import {
  mergeAutofillWithExisting,
  parseSiteTextToProfile,
} from "@/lib/product-profile-autofill";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { callWormsoftCompanyProfile, WormsoftError } from "@/lib/wormsoft-client";
import type { CompanyProfileResponse } from "@/lib/wormsoft-types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export type { CompanyProfileResponse } from "@/lib/wormsoft-types";

const MAX_HTML_FOR_MODEL = 80_000;

const COMPANY_PROFILE_JSON_SCHEMA = `{
  "niche": string | null,           // ниша / чем занимается компания одной фразой
  "services": string[],            // перечень услуг
  "products": string[],           // продукты / товары / решения
  "regions": string[],            // география работы (города, регионы, «вся Россия»)
  "min_check": number | null,     // минимальный чек в рублях, только если явно в тексте
  "avg_check": number | null,     // средний чек в рублях, только если явно в тексте
  "priority_clients": string | null, // кто целевой клиент
  "unique_selling_points": string[], // УТП
  "upsell_services": string[],       // доп. услуги для допродажи
  "anti_ideal_clients": string | null // кого компания не хочет видеть клиентами
}`;

const SYSTEM_PARSE_SITE = `Ты — опытный маркетолог и продуктолог. Твоя задача — по тексту сайта компании заполнить структуру профиля бизнеса для CRM-системы SalesCoach. Всегда отвечай строго валидным JSON без пояснений и без форматирования маркдауном. Если каких-то данных нет в тексте, ставь null или пустой массив.`;

function stripTags(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(html: string, regex: RegExp) {
  const match = html.match(regex);
  return match?.[1]?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = (await request.json()) as {
      siteUrl?: string;
      url?: string;
      html?: string;
    };

    const siteUrlRaw = (body.siteUrl ?? body.url)?.trim();
    if (!siteUrlRaw) {
      return NextResponse.json({ error: "Укажите URL сайта" }, { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(siteUrlRaw);
    } catch {
      return NextResponse.json({ error: "Некорректный URL" }, { status: 400 });
    }

    const usedLegacySiteUrlKey = Boolean(body.siteUrl?.trim());
    const htmlTrimmed =
      typeof body.html === "string" ? body.html.trim() : "";

    let pageHtml: string;
    if (htmlTrimmed) {
      pageHtml = htmlTrimmed;
    } else if (usedLegacySiteUrlKey) {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "User-Agent": "SalesCoachAI/1.0" },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Не удалось загрузить сайт: ${res.status}` },
          { status: 400 }
        );
      }
      pageHtml = await res.text();
    } else {
      return NextResponse.json(
        {
          error:
            "Передайте поле html с текстом или разметкой страницы. Для автозагрузки по ссылке используйте поле siteUrl.",
        },
        { status: 400 }
      );
    }

    const title = stripTags(
      extract(pageHtml, /<title[^>]*>([\s\S]*?)<\/title>/i)
    );
    const metaDescription = stripTags(
      extract(
        pageHtml,
        /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
      )
    );
    const h1 = stripTags(extract(pageHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
    const bodyTextRaw = stripTags(
      extract(pageHtml, /<body[^>]*>([\s\S]*?)<\/body>/i)
    );
    const bodyText = bodyTextRaw.slice(0, 2000);

    const parsedText = [
      title ? `Title: ${title}` : "",
      metaDescription ? `Description: ${metaDescription}` : "",
      h1 ? `H1: ${h1}` : "",
      bodyText ? `Body: ${bodyText}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const htmlForModel =
      pageHtml.length > MAX_HTML_FOR_MODEL
        ? pageHtml.slice(0, MAX_HTML_FOR_MODEL)
        : pageHtml;

    const userPrompt = `Вот URL и текст сайта компании.

URL: ${url.toString()}

Текст:
\`\`\`html
${htmlForModel}
\`\`\`

На основе этого заполни JSON со следующей структурой (типы полей):
${COMPANY_PROFILE_JSON_SCHEMA}`;

    let aiProfile: CompanyProfileResponse;
    try {
      aiProfile = await callWormsoftCompanyProfile({
        system: SYSTEM_PARSE_SITE,
        user: userPrompt,
      });
    } catch (e) {
      if (e instanceof WormsoftError) {
        return NextResponse.json({ error: e.message }, { status: 502 });
      }
      throw e;
    }

    const { data: existingProfile } = await supabase
      .from("company_profile")
      .select(
        "niche, services, products, manual_description, regions, min_check, avg_check, priority_clients, unique_selling_points, upsell_services, anti_ideal_clients"
      )
      .eq("user_id", userId)
      .maybeSingle();

    const parsedDraft = parseSiteTextToProfile(parsedText);
    const safeAutofill = mergeAutofillWithExisting(
      {
        niche: existingProfile?.niche ?? null,
        services: existingProfile?.services ?? null,
        products: existingProfile?.products ?? null,
        manual_description: existingProfile?.manual_description ?? null,
      },
      parsedDraft
    );

    const ex = existingProfile as Record<string, unknown> | null;

    const niche =
      aiProfile.niche ??
      safeAutofill.niche ??
      (typeof ex?.niche === "string" ? ex.niche : null) ??
      null;

    const services =
      (aiProfile.services.length ? aiProfile.services : null) ??
      safeAutofill.services ??
      (Array.isArray(ex?.services) ? (ex.services as string[]) : null) ??
      null;

    const products =
      (aiProfile.products.length ? aiProfile.products : null) ??
      safeAutofill.products ??
      (Array.isArray(ex?.products) ? (ex.products as string[]) : null) ??
      null;

    const manual_description =
      safeAutofill.manual_description ??
      (typeof ex?.manual_description === "string" ? ex.manual_description : null) ??
      null;

    const regions =
      (aiProfile.regions.length ? aiProfile.regions : null) ??
      (Array.isArray(ex?.regions) ? (ex.regions as string[]) : null) ??
      null;

    const min_check =
      aiProfile.min_check ??
      (typeof ex?.min_check === "number" ? ex.min_check : null) ??
      null;

    const avg_check =
      aiProfile.avg_check ??
      (typeof ex?.avg_check === "number" ? ex.avg_check : null) ??
      null;

    const priority_clients =
      aiProfile.priority_clients ??
      (typeof ex?.priority_clients === "string" ? ex.priority_clients : null) ??
      null;

    const unique_selling_points =
      (aiProfile.unique_selling_points.length
        ? aiProfile.unique_selling_points
        : null) ??
      (Array.isArray(ex?.unique_selling_points)
        ? (ex.unique_selling_points as string[])
        : null) ??
      null;

    const upsell_services =
      (aiProfile.upsell_services.length ? aiProfile.upsell_services : null) ??
      (Array.isArray(ex?.upsell_services) ? (ex.upsell_services as string[]) : null) ??
      null;

    const anti_ideal_clients =
      aiProfile.anti_ideal_clients ??
      (typeof ex?.anti_ideal_clients === "string" ? ex.anti_ideal_clients : null) ??
      null;

    const { error, data } = await supabase
      .from("company_profile")
      .upsert(
        {
          user_id: userId,
          site_url: url.toString(),
          parsed_text: parsedText,
          niche,
          services,
          products,
          manual_description,
          regions,
          min_check,
          avg_check,
          priority_clients,
          unique_selling_points,
          upsell_services,
          anti_ideal_clients,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select(
        "site_url, parsed_text, niche, services, products, manual_description, regions, min_check, avg_check, priority_clients, unique_selling_points, upsell_services, anti_ideal_clients"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Не удалось сохранить профиль сайта" },
        { status: 500 }
      );
    }

    const filled: string[] = [];
    const wasEmpty = (v: unknown) =>
      v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

    if (wasEmpty(existingProfile?.niche) && niche) filled.push("niche");
    if (wasEmpty(existingProfile?.services) && services?.length) filled.push("services");
    if (wasEmpty(existingProfile?.products) && products?.length) filled.push("products");
    if (wasEmpty(existingProfile?.manual_description) && manual_description) {
      filled.push("manual_description");
    }
    if (wasEmpty(existingProfile?.regions) && regions?.length) filled.push("regions");
    if (existingProfile?.min_check == null && min_check != null) filled.push("min_check");
    if (existingProfile?.avg_check == null && avg_check != null) filled.push("avg_check");
    if (wasEmpty(existingProfile?.priority_clients) && priority_clients) {
      filled.push("priority_clients");
    }
    if (
      wasEmpty(existingProfile?.unique_selling_points) &&
      unique_selling_points?.length
    ) {
      filled.push("unique_selling_points");
    }
    if (wasEmpty(existingProfile?.upsell_services) && upsell_services?.length) {
      filled.push("upsell_services");
    }
    if (wasEmpty(existingProfile?.anti_ideal_clients) && anti_ideal_clients) {
      filled.push("anti_ideal_clients");
    }

    return NextResponse.json({
      profile: data,
      autofill: { filled },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка парсинга сайта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
