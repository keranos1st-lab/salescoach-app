"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyProfile } from "@/lib/company-profile";

function arrayFieldToLines(value: string[] | null | undefined): string {
  return value?.length ? value.join("\n") : "";
}

function linesToStringArray(text: string): string[] | null {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function intToInputValue(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(n);
}

function inputValueToInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25";
const labelClass = "text-sm font-medium text-zinc-300";
const helpClass = "text-xs text-zinc-500";

export function ProductWorkspace({
  initialProfile,
}: {
  initialProfile: CompanyProfile;
}) {
  const router = useRouter();
  const [siteUrl, setSiteUrl] = useState(initialProfile.site_url ?? "");
  const [parsedText, setParsedText] = useState(initialProfile.parsed_text ?? "");
  const [manualDescription, setManualDescription] = useState(
    initialProfile.manual_description ?? ""
  );
  const [niche, setNiche] = useState(initialProfile.niche ?? "");
  const [servicesText, setServicesText] = useState(
    arrayFieldToLines(initialProfile.services)
  );
  const [productsText, setProductsText] = useState(
    arrayFieldToLines(initialProfile.products)
  );
  const [regionsText, setRegionsText] = useState(
    arrayFieldToLines(initialProfile.regions)
  );
  const [minCheckInput, setMinCheckInput] = useState(
    intToInputValue(initialProfile.min_check)
  );
  const [avgCheckInput, setAvgCheckInput] = useState(
    intToInputValue(initialProfile.avg_check)
  );
  const [priorityClients, setPriorityClients] = useState(
    initialProfile.priority_clients ?? ""
  );
  const [uspText, setUspText] = useState(
    arrayFieldToLines(initialProfile.unique_selling_points)
  );
  const [upsellText, setUpsellText] = useState(
    arrayFieldToLines(initialProfile.upsell_services)
  );
  const [antiIdealClients, setAntiIdealClients] = useState(
    initialProfile.anti_ideal_clients ?? ""
  );
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSiteUrl(initialProfile.site_url ?? "");
    setParsedText(initialProfile.parsed_text ?? "");
    setManualDescription(initialProfile.manual_description ?? "");
    setNiche(initialProfile.niche ?? "");
    setServicesText(arrayFieldToLines(initialProfile.services));
    setProductsText(arrayFieldToLines(initialProfile.products));
    setRegionsText(arrayFieldToLines(initialProfile.regions));
    setMinCheckInput(intToInputValue(initialProfile.min_check));
    setAvgCheckInput(intToInputValue(initialProfile.avg_check));
    setPriorityClients(initialProfile.priority_clients ?? "");
    setUspText(arrayFieldToLines(initialProfile.unique_selling_points));
    setUpsellText(arrayFieldToLines(initialProfile.upsell_services));
    setAntiIdealClients(initialProfile.anti_ideal_clients ?? "");
  }, [initialProfile]);

  async function parseSite() {
    if (!siteUrl.trim()) return;
    setLoadingParse(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/product/parse-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: siteUrl.trim() }),
      });
      const json = (await res.json()) as {
        error?: string;
        profile?: {
          parsed_text?: string | null;
          site_url?: string | null;
          niche?: string | null;
          services?: string[] | null;
          products?: string[] | null;
          manual_description?: string | null;
          regions?: string[] | null;
          min_check?: number | null;
          avg_check?: number | null;
          priority_clients?: string | null;
          unique_selling_points?: string[] | null;
          upsell_services?: string[] | null;
          anti_ideal_clients?: string | null;
        };
        autofill?: { filled?: string[] };
      };
      if (!res.ok) {
        setError(json.error || "Не удалось загрузить описание сайта");
        return;
      }
      setSiteUrl(json.profile?.site_url ?? siteUrl.trim());
      setParsedText(json.profile?.parsed_text ?? "");
      if (!niche.trim() && json.profile?.niche?.trim()) {
        setNiche(json.profile.niche.trim());
      }
      if (!servicesText.trim() && json.profile?.services?.length) {
        setServicesText(json.profile.services.join("\n"));
      }
      if (!productsText.trim() && json.profile?.products?.length) {
        setProductsText(json.profile.products.join("\n"));
      }
      if (!manualDescription.trim() && json.profile?.manual_description?.trim()) {
        setManualDescription(json.profile.manual_description.trim());
      }
      if (!regionsText.trim() && json.profile?.regions?.length) {
        setRegionsText(json.profile.regions.join("\n"));
      }
      if (!minCheckInput.trim() && json.profile?.min_check != null) {
        setMinCheckInput(intToInputValue(json.profile.min_check));
      }
      if (!avgCheckInput.trim() && json.profile?.avg_check != null) {
        setAvgCheckInput(intToInputValue(json.profile.avg_check));
      }
      if (!priorityClients.trim() && json.profile?.priority_clients?.trim()) {
        setPriorityClients(json.profile.priority_clients.trim());
      }
      if (!uspText.trim() && json.profile?.unique_selling_points?.length) {
        setUspText(json.profile.unique_selling_points.join("\n"));
      }
      if (!upsellText.trim() && json.profile?.upsell_services?.length) {
        setUpsellText(json.profile.upsell_services.join("\n"));
      }
      if (!antiIdealClients.trim() && json.profile?.anti_ideal_clients?.trim()) {
        setAntiIdealClients(json.profile.anti_ideal_clients.trim());
      }

      const filledCount = json.autofill?.filled?.length ?? 0;
      if (filledCount > 0) {
        setSuccess(
          "Описание сайта загружено. Часть полей анкеты заполнена автоматически — проверьте и при необходимости отредактируйте."
        );
      } else {
        setSuccess("Описание сайта загружено. Дополнительные поля не удалось заполнить автоматически.");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoadingParse(false);
    }
  }

  async function saveProfile() {
    setLoadingSave(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/product/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: siteUrl.trim() || null,
          parsedText: parsedText.trim() || null,
          manualDescription: manualDescription.trim() || null,
          niche: niche.trim() || null,
          services: linesToStringArray(servicesText),
          products: linesToStringArray(productsText),
          regions: linesToStringArray(regionsText),
          minCheck: inputValueToInt(minCheckInput),
          avgCheck: inputValueToInt(avgCheckInput),
          priorityClients: priorityClients.trim() || null,
          uniqueSellingPoints: linesToStringArray(uspText),
          upsellServices: linesToStringArray(upsellText),
          antiIdealClients: antiIdealClients.trim() || null,
          autoParse: Boolean(parsedText.trim()),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Не удалось сохранить профиль продукта");
        return;
      }
      setSuccess("Профиль продукта сохранен");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoadingSave(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Продукт</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Анкета компании: ниша, услуги, география и УТП — чтобы разбор звонков был точнее
        </p>
      </header>

      <FormSection
        title="Сайт"
        description="Официальный сайт и автоматически собранное описание страницы."
      >
        <div className="space-y-2">
          <label htmlFor="site-url" className={labelClass}>
            Сайт компании
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="site-url"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={parseSite}
              disabled={!siteUrl.trim() || loadingParse}
              className="shrink-0 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingParse ? "Загрузка..." : "Загрузить описание"}
            </button>
          </div>
          <p className={helpClass}>
            Если есть сайт — укажи его. Позже мы будем автоматически анализировать услуги и
            товары через ИИ.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="parsed-text" className={labelClass}>
            Автоописание с сайта
          </label>
          <textarea
            id="parsed-text"
            value={parsedText}
            readOnly
            rows={6}
            className={`${fieldClass} bg-zinc-950/70 text-zinc-300`}
          />
        </div>
      </FormSection>

      <FormSection
        title="Описание вручную"
        description="Кратко опишите, что продаёт компания, если хотите дополнить или заменить текст с сайта."
      >
        <div className="space-y-2">
          <label htmlFor="manual-description" className={labelClass}>
            Описание продукта/услуги
          </label>
          <textarea
            id="manual-description"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value.slice(0, 2000))}
            maxLength={2000}
            rows={6}
            placeholder="Например: остекление и отделка балконов под ключ в Москве и МО"
            className={fieldClass}
          />
          <p className={helpClass}>{manualDescription.length}/2000</p>
        </div>
      </FormSection>

      <FormSection
        title="Основное направление"
        description="В одной фразе — чем вы занимаетесь и для кого."
      >
        <div className="space-y-2">
          <label htmlFor="niche" className={labelClass}>
            Ниша / чем занимается компания
          </label>
          <textarea
            id="niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            rows={3}
            placeholder="Например: холодное и тёплое остекление квартир и частных домов"
            className={fieldClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="Основные услуги"
        description="Перечислите услуги, которые приносят основную выручку."
      >
        <div className="space-y-2">
          <label htmlFor="services" className={labelClass}>
            Основные услуги
          </label>
          <textarea
            id="services"
            value={servicesText}
            onChange={(e) => setServicesText(e.target.value)}
            rows={6}
            placeholder={"Остекление балконов\nУтепление лоджии\nЗамена окон"}
            className={fieldClass}
          />
          <p className={helpClass}>
            Каждая услуга с новой строки. Например: остекление балконов
          </p>
        </div>
      </FormSection>

      <FormSection
        title="Основные товары / решения"
        description="Готовые продукты, пакеты или форматы работы."
      >
        <div className="space-y-2">
          <label htmlFor="products" className={labelClass}>
            Основные товары / решения
          </label>
          <textarea
            id="products"
            value={productsText}
            onChange={(e) => setProductsText(e.target.value)}
            rows={6}
            placeholder={"Панорамное остекление\nСистема ПВХ Pro\nКомплекс «под ключ»"}
            className={fieldClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="География"
        description="Города, регионы или зоны, где вы реально работаете."
      >
        <div className="space-y-2">
          <label htmlFor="regions" className={labelClass}>
            Где работаете
          </label>
          <textarea
            id="regions"
            value={regionsText}
            onChange={(e) => setRegionsText(e.target.value)}
            rows={5}
            placeholder={"Москва\nМосковская область\nКрасногорск"}
            className={fieldClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="Чеки и приоритет"
        description="Помогает оценивать, насколько звонок попадает в вашу экономику."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="min-check" className={labelClass}>
              Минимальный желательный чек, ₽
            </label>
            <input
              id="min-check"
              type="number"
              inputMode="numeric"
              min={0}
              value={minCheckInput}
              onChange={(e) => setMinCheckInput(e.target.value)}
              placeholder="например 80000"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="avg-check" className={labelClass}>
              Средний чек, ₽
            </label>
            <input
              id="avg-check"
              type="number"
              inputMode="numeric"
              min={0}
              value={avgCheckInput}
              onChange={(e) => setAvgCheckInput(e.target.value)}
              placeholder="например 250000"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="priority-clients" className={labelClass}>
            Идеальный клиент
          </label>
          <textarea
            id="priority-clients"
            value={priorityClients}
            onChange={(e) => setPriorityClients(e.target.value)}
            rows={5}
            placeholder="Кто для вас лучший клиент: тип жилья, бюджет, мотивация, сроки"
            className={fieldClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="УТП"
        description="Чем вы принципиально отличаетесь от конкурентов."
      >
        <div className="space-y-2">
          <label htmlFor="usp" className={labelClass}>
            Ключевые преимущества
          </label>
          <textarea
            id="usp"
            value={uspText}
            onChange={(e) => setUspText(e.target.value)}
            rows={6}
            placeholder={"Собственное производство\nГарантия 10 лет\nЗамер в день обращения"}
            className={fieldClass}
          />
          <p className={helpClass}>Каждое преимущество с новой строки.</p>
        </div>
      </FormSection>

      <FormSection
        title="Допродажи"
        description="Что можно предложить после основной сделки."
      >
        <div className="space-y-2">
          <label htmlFor="upsell" className={labelClass}>
            Дополнительные услуги для допродаж
          </label>
          <textarea
            id="upsell"
            value={upsellText}
            onChange={(e) => setUpsellText(e.target.value)}
            rows={5}
            placeholder={"Отливы\nМоскитные сетки\nПодоконники"}
            className={fieldClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="Ограничения"
        description="Чтобы не тратить время на заведомо неподходящие лиды."
      >
        <div className="space-y-2">
          <label htmlFor="anti-ideal" className={labelClass}>
            Какие клиенты или заказы вам не подходят
          </label>
          <textarea
            id="anti-ideal"
            value={antiIdealClients}
            onChange={(e) => setAntiIdealClients(e.target.value)}
            rows={5}
            placeholder="Например: только советский фонд без согласования, объекты дальше 100 км без доплаты"
            className={fieldClass}
          />
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <button
          type="button"
          onClick={saveProfile}
          disabled={loadingSave}
          className="rounded-xl bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d9488]/25 transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loadingSave ? "Сохранение..." : "Сохранить анкету"}
        </button>
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
