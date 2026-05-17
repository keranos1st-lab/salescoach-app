"use client";

import { SubscriptionBanner } from "@/components/profile/SubscriptionBanner";
import type { SubscriptionDisplayStatus } from "@/lib/subscription-ui";

type SubscriptionManagementProps = {
  planLabel: string;
  priceLine: string;
  displayStatus: SubscriptionDisplayStatus;
  statusLabel: string;
  trialDaysLeft: number | null;
  showBanner: boolean;
  bannerMessage: string;
  ctaLabel: string;
};

function statusBadgeClass(status: SubscriptionDisplayStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/20 text-emerald-300";
    case "trial":
      return "bg-teal-500/20 text-teal-300";
    case "expired":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-zinc-500/20 text-zinc-400";
  }
}

export function scrollToPlansSection() {
  document
    .getElementById("subscription-plans")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SubscriptionManagement({
  planLabel,
  priceLine,
  displayStatus,
  statusLabel,
  trialDaysLeft,
  showBanner,
  bannerMessage,
  ctaLabel,
}: SubscriptionManagementProps) {
  return (
    <div className="flex flex-col gap-4">
      {showBanner ? (
        <SubscriptionBanner
          message={bannerMessage}
          ctaLabel={ctaLabel}
          onCtaClick={scrollToPlansSection}
        />
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Подписка</h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Тариф: </span>
            {planLabel}
          </p>
          <p>
            <span className="text-zinc-500">Стоимость: </span>
            {priceLine}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500">Статус: </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(displayStatus)}`}
            >
              {statusLabel}
            </span>
          </p>
          {trialDaysLeft !== null ? (
            trialDaysLeft === 0 ? (
              <p className="text-red-400">Пробный период истёк</p>
            ) : (
              <p className="text-emerald-400">
                Осталось {trialDaysLeft} дн. пробного периода
              </p>
            )
          ) : null}
        </div>
        <button
          type="button"
          onClick={scrollToPlansSection}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
        >
          {ctaLabel}
        </button>
      </section>
    </div>
  );
}
