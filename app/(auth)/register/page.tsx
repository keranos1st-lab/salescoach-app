import { SiteFooter } from "@/components/site-footer";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <SignUp appearance={{ variables: { colorPrimary: "#0d9488" } }} signInUrl="/login" />
      <SiteFooter />
    </div>
  );
}
