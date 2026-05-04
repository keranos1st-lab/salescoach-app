import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <LoginForm />
      <SiteFooter />
    </div>
  );
}
