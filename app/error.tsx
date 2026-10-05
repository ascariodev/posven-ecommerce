"use client";

import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <meta name="robots" content="noindex" />
      <EmptyState
        icon={TriangleAlert}
        headingLevel="h1"
        title="No pudimos cargar esta página"
        description="Algo falló de nuestro lado. Intenta de nuevo en unos segundos."
      >
        <Button size="lg" onClick={() => retry()}>
          Intentar de nuevo
        </Button>
      </EmptyState>
    </>
  );
}
