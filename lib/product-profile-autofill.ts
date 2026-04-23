type ParsedProfileFields = {
  niche: string | null;
  services: string[] | null;
  products: string[] | null;
  manual_description: string | null;
};

type ExistingProfileLike = {
  niche?: string | null;
  services?: string[] | null;
  products?: string[] | null;
  manual_description?: string | null;
};

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").replace(/[•●▪◦*-]\s*/g, "").trim();
}

function toLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map(normalizeLine)
    .filter((line) => line.length >= 3);
}

function dedupe(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function pickNiche(lines: string[]): string | null {
  const nicheSignals = [
    "мы занимаемся",
    "компания",
    "основное направление",
    "специализ",
    "мы делаем",
    "предлагаем",
  ];
  const candidate =
    lines.find((line) =>
      nicheSignals.some((signal) => line.toLowerCase().includes(signal))
    ) ?? lines[0];
  if (!candidate) return null;
  return candidate.slice(0, 220);
}

function parseTaggedSection(
  lines: string[],
  headers: string[],
  itemLimit: number
): string[] {
  const out: string[] = [];
  let inSection = false;
  for (const rawLine of lines) {
    const line = rawLine.toLowerCase();
    const isHeader = headers.some((h) => line.includes(h));
    if (isHeader) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.length < 3) continue;
      if (/^(title:|description:|h1:|body:)/i.test(rawLine)) continue;
      if (
        line.includes("контакты") ||
        line.includes("о нас") ||
        line.includes("цены") ||
        line.includes("отзывы")
      ) {
        break;
      }
      out.push(rawLine.slice(0, 110));
      if (out.length >= itemLimit) break;
    }
  }
  return dedupe(out, itemLimit);
}

function extractByKeywords(
  lines: string[],
  keywords: string[],
  itemLimit: number
): string[] {
  const matches: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      matches.push(line.slice(0, 110));
    }
  }
  return dedupe(matches, itemLimit);
}

function buildManualDescription(lines: string[], niche: string | null): string | null {
  const bodyLines = lines.filter(
    (line) => !/^(title:|description:|h1:|body:)/i.test(line)
  );
  const first = bodyLines[0] ?? "";
  const second = bodyLines[1] ?? "";
  const parts = [niche ?? "", first, second]
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!parts.length) return null;
  return dedupe(parts, 3).join(". ").slice(0, 600);
}

export function parseSiteTextToProfile(parsedText: string): ParsedProfileFields {
  const lines = toLines(parsedText);
  if (!lines.length) {
    return {
      niche: null,
      services: null,
      products: null,
      manual_description: null,
    };
  }

  const niche = pickNiche(lines);

  const servicesFromSection = parseTaggedSection(
    lines,
    ["наши услуги", "услуги", "что делаем", "наши работы"],
    7
  );
  const productsFromSection = parseTaggedSection(
    lines,
    ["продукты", "товары", "решения", "каталог"],
    7
  );

  const serviceKeywords = [
    "монтаж",
    "ремонт",
    "установка",
    "отделка",
    "проект",
    "обслуживание",
    "консалтинг",
    "настройка",
  ];
  const productKeywords = [
    "модель",
    "система",
    "комплект",
    "товар",
    "продукт",
    "пакет",
    "тариф",
    "решение",
  ];

  const fallbackServices = extractByKeywords(lines, serviceKeywords, 7);
  const fallbackProducts = extractByKeywords(lines, productKeywords, 7);

  const services = servicesFromSection.length
    ? servicesFromSection
    : fallbackServices.length
      ? fallbackServices
      : null;
  const products = productsFromSection.length
    ? productsFromSection
    : fallbackProducts.length
      ? fallbackProducts
      : null;

  const manual_description = buildManualDescription(lines, niche);

  return { niche, services, products, manual_description };
}

export function mergeAutofillWithExisting(
  base: ExistingProfileLike,
  autofill: ParsedProfileFields
): ParsedProfileFields {
  const isEmptyText = (value: string | null | undefined) => !value?.trim();
  const isEmptyList = (value: string[] | null | undefined) => !value?.length;

  return {
    niche: isEmptyText(base.niche) ? autofill.niche : null,
    services: isEmptyList(base.services) ? autofill.services : null,
    products: isEmptyList(base.products) ? autofill.products : null,
    manual_description: isEmptyText(base.manual_description)
      ? autofill.manual_description
      : null,
  };
}
