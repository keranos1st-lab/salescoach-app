import { PublicSurfaceHeader } from "@/components/public-surface-header";

export default function OfferLayout({
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
