import Image from "next/image";
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
      <div className="mt-8 border-t border-zinc-800 py-4">
        <p className="footer-studio-credit text-center text-xs text-zinc-500">
          © 2026 SalesCoach | Разработано{" "}
          <Image
            src="/vizi-studio-logo.png"
            alt="Vizi Studio"
            width={40}
            height={40}
            className="mx-1 inline-block align-middle"
          />
          <span>Vizi Studio</span>
        </p>
      </div>
    </footer>
  );
}
