import {
  antiIdealSignals,
  findMatchedItems,
  hasCheapSignal,
  hasQualificationSignal,
} from "@/lib/call-analysis-product";
import type { CompanyProfile } from "@/lib/company-profile";

export type ProductCallSignals = {
  product_context_used: boolean;
  matched_services: string[];
  matched_products: string[];
  matched_usps: string[];
  matched_upsells: string[];
  product_notes: string[];
  supplemental_positives: string[];
  supplemental_negatives: string[];
};

/**
 * Локальные сигналы по профилю компании (совпадения и пробелы относительно анкеты).
 * Не дублирует общую оценку звонка — её даёт LLM.
 */
export function buildProductCallSignals(
  transcript: string,
  profile?: CompanyProfile | null
): ProductCallSignals {
  const product_notes: string[] = [];
  const supplemental_positives: string[] = [];
  const supplemental_negatives: string[] = [];
  const hasProfile = Boolean(profile);

  const matched_services = findMatchedItems(transcript, profile?.services);
  const matched_products = findMatchedItems(transcript, profile?.products);
  const matched_usps = findMatchedItems(
    transcript,
    profile?.unique_selling_points
  );
  const matched_upsells = findMatchedItems(transcript, profile?.upsell_services);
  const hasAnyProductMatch =
    matched_services.length > 0 ||
    matched_products.length > 0 ||
    matched_usps.length > 0;

  if (!hasProfile) {
    return {
      product_context_used: false,
      matched_services,
      matched_products,
      matched_usps,
      matched_upsells,
      product_notes,
      supplemental_positives,
      supplemental_negatives,
    };
  }

  if (matched_services.length) {
    supplemental_positives.push(
      "Менеджер озвучил услуги компании, разговор опирается на продуктовый контекст, а не только на общие слова."
    );
    product_notes.push(`Упомянуты услуги: ${matched_services.join(", ")}`);
  }

  if (matched_products.length) {
    supplemental_positives.push(
      "Менеджер назвал конкретные продукты — клиенту проще связать задачу с тем, что компания реально продаёт."
    );
    product_notes.push(`Упомянуты продукты: ${matched_products.join(", ")}`);
  }

  if (matched_usps.length) {
    supplemental_positives.push(
      "В разговоре прозвучали уникальные преимущества компании, это усиливает доверие и снижает сравнение только по цене."
    );
    product_notes.push(`Отработаны УТП: ${matched_usps.join(", ")}`);
  }

  if (matched_upsells.length) {
    supplemental_positives.push(
      "Есть попытка допродажи дополнительных услуг, менеджер расширяет чек и ценность для клиента."
    );
    product_notes.push(
      `Упомянуты допродажи/доп. услуги: ${matched_upsells.join(", ")}`
    );
  }

  if (profile?.unique_selling_points?.length && !matched_usps.length) {
    supplemental_negatives.push(
      "В профиле есть сильные УТП, но в разговоре они не прозвучали — клиент не получил причин выбрать именно вас."
    );
    product_notes.push("Рекомендация: добавить 1-2 УТП в основной скрипт звонка.");
  }

  if (profile?.upsell_services?.length && !matched_upsells.length) {
    supplemental_negatives.push(
      "Не использована возможность допродажи: доп. услуги из профиля не были предложены клиенту."
    );
    product_notes.push(
      "Рекомендация: в конце диалога делать короткий блок апсейла релевантной доп. услуги."
    );
  }

  const cheapSignal = hasCheapSignal(transcript);
  const qualificationSignal = hasQualificationSignal(transcript);
  if (cheapSignal && profile?.min_check && !qualificationSignal) {
    supplemental_negatives.push(
      "В диалоге есть фокус на дешевизне, но менеджер не квалифицировал клиента по бюджету и критериям — повышается риск нецелевой сделки."
    );
    product_notes.push(
      "Рекомендация: при запросе 'подешевле' уточнять бюджет, задачу, сроки и критерии выбора до обсуждения скидок."
    );
  }

  const antiIdealMatches = antiIdealSignals(transcript, profile);
  if (antiIdealMatches.length && !qualificationSignal) {
    supplemental_negatives.push(
      "В разговоре есть признаки анти-идеального клиента, но менеджер не провёл квалификацию и не сузил сценарий."
    );
    product_notes.push(
      `Рекомендация: при таких сигналах задавать уточняющие вопросы и ограничивать предложение. Сигналы: ${antiIdealMatches.join(
        ", "
      )}.`
    );
  }

  if (!hasAnyProductMatch) {
    supplemental_negatives.push(
      "Разговор слишком общий и почти не привязан к продукту компании: не прозвучали услуги, продукты и УТП."
    );
    product_notes.push(
      "Рекомендация: опираться на профиль компании и в каждом звонке фиксировать продуктовую релевантность."
    );
  }

  return {
    product_context_used: true,
    matched_services,
    matched_products,
    matched_usps,
    matched_upsells,
    product_notes,
    supplemental_positives,
    supplemental_negatives,
  };
}
