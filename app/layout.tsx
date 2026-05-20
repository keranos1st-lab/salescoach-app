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

export const metadata: Metadata = {
  metadataBase: new URL("https://salescoach-app.vercel.app"),
  title: "SalesCoach — ИИ-анализ звонков для руководителей продаж",
  description:
    "Загружайте звонки менеджеров, получайте автоматический анализ, управленческие отчёты и рекомендации по коучингу. Выявляйте риски и точки роста каждого менеджера.",
  keywords:
    "анализ звонков, коучинг продажи, ИИ для продаж, управленческий отчёт, SalesCoach",
  authors: [{ name: "SalesCoach" }],
  creator: "SalesCoach",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SalesCoach — ИИ-анализ звонков",
    description:
      "Автоматический анализ звонков, управленческие отчёты и коучинг для руководителей продаж.",
    url: "https://salescoach-app.vercel.app",
    siteName: "SalesCoach",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesCoach — ИИ-анализ звонков",
    description: "Автоматический анализ звонков и коучинг для руководителей продаж.",
    images: ["/opengraph-image"],
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
