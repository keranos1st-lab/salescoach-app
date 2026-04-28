import Link from "next/link";

const footerLinks = [
  { href: "/pricing", label: "Тарифы" },
  { href: "/offer", label: "Публичная оферта" },
  { href: "/contacts", label: "Контакты" },
  { href: "/requisites", label: "Реквизиты" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-zinc-800/80 pt-6 text-sm text-zinc-400">
      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-teal-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-center text-xs text-zinc-500">
        © 2026 SalesCoach. Гришин Максим Александрович, ИНН 270414087648
      </p>
    </footer>
  );
}
