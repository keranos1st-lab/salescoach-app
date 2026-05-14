import { PublicSurfaceHeader } from "@/components/public-surface-header";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicSurfaceHeader />
      {children}
    </>
  );
}
