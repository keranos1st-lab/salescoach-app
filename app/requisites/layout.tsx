import { PublicSurfaceHeader } from "@/components/public-surface-header";

export default function RequisitesLayout({
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
