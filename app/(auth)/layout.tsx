import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${inter.className} min-h-full`}>{children}</div>;
}
