import Link from "next/link";
import type {
  SubscriptionDisplayStatus,
  SubscriptionStatusBarModel,
} from "@/lib/subscription-ui";

const BADGE_CLASS: Record<SubscriptionDisplayStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  trial: "bg-amber-500/20 text-amber-300",
  expired: "bg-red-500/20 text-red-300",
  none: "bg-zinc-500/20 text-zinc-400",
};

const BADGE_LABEL: Record<SubscriptionDisplayStatus, string> = {
  active: "Активен",
  trial: "Пробный",
  expired: "Истёк",
  none: "Нет",
};

type SubscriptionStatusBarProps = SubscriptionStatusBarModel;

export function SubscriptionStatusBar({
  planLabel,
  termLine,
  callsLine,
  managersLine,
  managersOverLimit,
  managersWarning,
  ctaLabel,
  displayStatus,
  soonEnding,
}: SubscriptionStatusBarProps) {
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/80 p-3">
      {managersWarning ? (
        <p
          role="alert"
          className="mb-2.5 rounded-lg border border-red-900/50 bg-red-950/40 px-2.5 py-2 text-[10px] leading-snug text-red-300"
        >
          {managersWarning}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-zinc-100">
              {planLabel}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE_CLASS[displayStatus]}`}
            >
              {BADGE_LABEL[displayStatus]}
            </span>
          </div>
          <p className="text-xs text-zinc-400">{termLine}</p>
          {soonEnding ? (
            <p className="text-[10px] font-medium text-amber-400">Скоро закончится</p>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-500 sm:w-auto sm:min-w-[140px]">
          <div>
            <span className="block text-zinc-600">Звонки</span>
            <span className="text-zinc-300">{callsLine}</span>
          </div>
          <div>
            <span className="block text-zinc-600">Менеджеры</span>
            <span
              className={
                managersOverLimit
                  ? "font-medium text-red-400"
                  : "text-zinc-300"
              }
            >
              {managersLine}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/profile?open=plans"
        className="mt-2.5 flex w-full items-center justify-center rounded-lg bg-teal-600/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-500"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
