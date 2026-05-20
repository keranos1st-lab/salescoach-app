import "./globals.css";
import "./report-print.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Загружайте звонки менеджеров и получайте автоматический анализ, отчёты по каждому менеджеру и рекомендации для руководителя отдела продаж.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salescoach-app.vercel.app"),
  title: "SalesCoach — ИИ-анализ звонков для руководителей продаж",
  description: siteDescription,
  keywords:
    "анализ звонков, отдел продаж, ИИ для продаж, управленческий отчёт, SalesCoach",
  authors: [{ name: "SalesCoach" }],
  creator: "SalesCoach",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "SalesCoach — контроль отдела продаж",
    description: siteDescription,
    url: "https://salescoach-app.vercel.app",
    siteName: "SalesCoach",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SalesCoach — Контроль отдела продаж на основе данных",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesCoach — контроль отдела продаж",
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
