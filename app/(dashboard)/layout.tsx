import { getCachedSession } from "@/lib/cached-session";
import { redirect } from "next/navigation";

export const revalidate = 30;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
