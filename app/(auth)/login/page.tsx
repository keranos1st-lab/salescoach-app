import { SiteFooter } from "@/components/site-footer";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <SignIn appearance={{ variables: { colorPrimary: "#0d9488" } }} signUpUrl="/register" />
      <SiteFooter />
    </div>
  );
}
