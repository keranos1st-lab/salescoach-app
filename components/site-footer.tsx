import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/pricing", label: "Тарифы" },
  { href: "/faq", label: "FAQ" },
  { href: "/offer", label: "Публичная оферта" },
  { href: "/privacy", label: "Политика ПД" },
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
      <div className="mt-8 border-t border-zinc-800 py-4">
        <p className="footer-studio-credit text-center text-xs text-zinc-500">
          © 2026 SalesCoach | Разработано{" "}
          <Link
            href="https://vizistudio.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 align-middle transition hover:text-teal-300"
          >
            <Image
              src="/vizi-studio-logo.png"
              alt="Vizi Studio"
              width={40}
              height={40}
              className="inline-block"
            />
            <span>Vizi Studio</span>
          </Link>
        </p>
      </div>
    </footer>
  );
}
