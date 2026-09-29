"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-8 shadow-card">
      <meta name="robots" content="noindex" />
      <h1 className="text-3xl font-bold tracking-tight">No pudimos cargar esta página</h1>
      <p className="text-muted-foreground">
        El servicio de búsqueda no responde. Intenta de nuevo en unos segundos.
      </p>
      <Button onClick={() => retry()}>Reintentar</Button>
    </section>
  );
}
