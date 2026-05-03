import { LogoutButton } from "@/app/dashboard/logout-button";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/calls", label: "Звонки" },
  { href: "/managers", label: "Менеджеры" },
  { href: "/reports", label: "Отчеты" },
  { href: "/product", label: "Продукт 📦" },
] as const;

export async function AppShell({
  activeHref,
  children,
}: {
  activeHref: string;
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  let userTitle = "Пользователь";
  if (userId) {
    const user = await currentUser();
    userTitle =
      user?.firstName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      userTitle;
  }

  return (
    <div className="flex h-screen min-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <aside className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900/40">
        <div className="shrink-0 border-b border-zinc-800 px-4 py-5">
          <Link
            href="/dashboard"
            className="brand-logo text-lg font-semibold tracking-tight"
          >
            SalesCoach{" "}
            <span className="text-[#0d9488]">AI</span>
          </Link>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="flex flex-col gap-0.5">
            {nav.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#0d9488]/15 text-[#5eead4]"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="shrink-0 border-t border-zinc-800 p-3">
          <p className="mb-2 truncate text-xs text-zinc-400">{userTitle}</p>
          <LogoutButton />
        </div>
      </aside>
      {children}
    </div>
  );
}
