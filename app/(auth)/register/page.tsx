import { SiteFooter } from "@/components/site-footer";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <RegisterForm />
      <SiteFooter />
    </div>
  );
}
