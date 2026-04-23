import type { CompanyProfile } from "@/lib/company-profile";

export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeList(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];
  return values
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 0);
}

export function findMatchedItems(
  transcript: string,
  items: string[] | null | undefined
): string[] {
  if (!items?.length) return [];
  const normalizedTranscript = normalizeText(transcript);
  if (!normalizedTranscript) return [];
  const normalizedItems = normalizeList(items);
  const matched: string[] = [];

  for (const [index, original] of items.entries()) {
    const normalized = normalizedItems[index];
    if (!normalized) continue;
    if (normalizedTranscript.includes(normalized)) {
      matched.push(original);
    }
  }

  return matched;
}

export function hasCheapSignal(transcript: string): boolean {
  const normalizedTranscript = normalizeText(transcript);
  const cheapSignals = ["дешево", "подешевле", "самый дешевый", "недорого"];
  return cheapSignals.some((signal) => normalizedTranscript.includes(signal));
}

export function hasQualificationSignal(transcript: string): boolean {
  const normalizedTranscript = normalizeText(transcript);
  const qualificationSignals = [
    "бюджет",
    "диапазон",
    "какой бюджет",
    "какая сумма",
    "какую сумму",
    "срок",
    "когда нужно",
    "для кого",
    "цель",
    "задач",
    "требован",
    "критер",
    "какой объем",
    "объем",
  ];

  return qualificationSignals.some((signal) =>
    normalizedTranscript.includes(signal)
  );
}

export function antiIdealSignals(
  transcript: string,
  profile: CompanyProfile | null | undefined
): string[] {
  const antiIdeal = profile?.anti_ideal_clients;
  if (!antiIdeal) return [];
  const normalizedTranscript = normalizeText(transcript);
  if (!normalizedTranscript) return [];

  const parts = antiIdeal
    .split(/[\n,;|]/g)
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 1);

  return parts.filter((signal) => normalizedTranscript.includes(signal));
}
