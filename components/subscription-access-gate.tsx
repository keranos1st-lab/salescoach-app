"use client";

import { useRouter } from "next/navigation";

type SubscriptionAccessGateProps = {
  blocked: boolean;
  title: string;
  message: string;
  children: React.ReactNode;
};

export function SubscriptionAccessGate({
  blocked,
  title,
  message,
  children,
}: SubscriptionAccessGateProps) {
  const router = useRouter();

  if (!blocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none select-none opacity-30">
        {children}
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{message}</p>
          <button
            type="button"
            onClick={() => router.push("/profile?open=plans")}
            className="mt-6 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            Выбрать тариф
          </button>
        </div>
      </div>
    </div>
  );
}
