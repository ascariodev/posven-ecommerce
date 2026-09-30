"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const POLL_INTERVAL_MS = 3000;

// Vuelve a pintar el resultado cada 3 s mientras está montado (spec cuentas-y-compras §5.3 paso 6):
// la página sólo lo monta con la compra pendiente, así que un estado final lo desmonta y para.
export function PurchasePoller({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-start gap-2">
      <p role="status" className="text-muted-foreground">
        Consultando el estado…
      </p>
      <Link href={href} prefetch={false} className="text-sm font-medium text-foreground underline underline-offset-4">
        Consultar de nuevo
      </Link>
    </div>
  );
}
