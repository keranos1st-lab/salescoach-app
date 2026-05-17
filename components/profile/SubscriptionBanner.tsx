"use client";

type SubscriptionBannerProps = {
  message: string;
  ctaLabel: string;
  onCtaClick: () => void;
};

export function SubscriptionBanner({
  message,
  ctaLabel,
  onCtaClick,
}: SubscriptionBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-600/40 bg-amber-950/40 p-5"
    >
      <p className="text-sm font-medium text-amber-100">{message}</p>
      <button
        type="button"
        onClick={onCtaClick}
        className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
