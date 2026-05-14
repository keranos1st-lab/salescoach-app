import { GuestAuthButtons } from "@/components/auth-buttons";
import { ThemeToggle } from "@/components/theme-toggle";

/** Fixed actions for public marketing / auth surfaces (not used in dashboard AppShell). */
export function PublicSurfaceHeader() {
  return (
    <header className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <GuestAuthButtons />
      <ThemeToggle />
    </header>
  );
}
