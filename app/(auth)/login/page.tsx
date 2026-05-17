import { SiteFooter } from "@/components/site-footer";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-sm text-zinc-400">
            Загрузка…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
