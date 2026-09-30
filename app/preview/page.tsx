import type { Metadata } from "next";
import { Suspense } from "react";
import { PreviewContent } from "./_components/PreviewContent";

export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando vista previa</p>}>
      <PreviewContent />
    </Suspense>
  );
}
