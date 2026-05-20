import { PublicSurfaceHeader } from "@/components/public-surface-header";

export default function FaqLayout({
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
