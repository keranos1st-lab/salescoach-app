import Link from "next/link";
import { getCachedSession } from "@/lib/cached-session";
import { GuestAuthButtons } from "@/components/auth-buttons";
import { LogoutButton } from "@/app/(dashboard)/dashboard/logout-button";

export async function HeaderAuthActions() {
  const session = await getCachedSession();

  if (!session?.user) {
    return <GuestAuthButtons />;
  }

  const label =
    session.user.name?.trim() ||
    session.user.email?.trim() ||
    "Профиль";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
      >
        {label}
      </Link>
      <LogoutButton compact />
    </div>
  );
}
