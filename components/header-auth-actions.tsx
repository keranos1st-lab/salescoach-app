import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GuestAuthButtons, SignOutButton } from "@/components/auth-buttons";

export async function HeaderAuthActions() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <GuestAuthButtons />;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
      >
        {session.user.name || session.user.email || "Пользователь"}
      </Link>
      <SignOutButton />
    </div>
  );
}
