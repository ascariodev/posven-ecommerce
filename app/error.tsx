"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="flex flex-col items-start gap-4">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold">No pudimos cargar esta página</h1>
      <p className="text-muted-foreground">
        El servicio de búsqueda no responde. Intenta de nuevo en unos segundos.
      </p>
      <Button onClick={() => retry()}>Reintentar</Button>
    </section>
  );
}
