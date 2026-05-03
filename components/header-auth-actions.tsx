import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GuestAuthButtons } from "@/components/auth-buttons";

export async function HeaderAuthActions() {
  const { userId } = await auth();

  if (!userId) {
    return <GuestAuthButtons />;
  }

  const user = await currentUser();
  const label =
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Профиль";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
      >
        {label}
      </Link>
      <UserButton />
    </div>
  );
}
