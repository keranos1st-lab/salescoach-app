import { PublicSurfaceHeader } from "@/components/public-surface-header";

export default function ContactsLayout({
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
