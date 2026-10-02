"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const POLL_DELAYS_MS = [3000, 5000, 10000] as const;
export const POLL_MAX_MS = 120000;

function delayFor(attempt: number): number {
  return POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)];
}

// Vuelve a pintar el resultado a los 3 s, 5 s y luego cada 10 s mientras está montado (spec
// cuentas-y-compras §5.3 paso 6): la página sólo lo monta con la compra pendiente, así que un estado
// final lo desmonta y para. Cuenta sólo el tiempo con la pestaña visible y se rinde a los 2 minutos.
export function PurchasePoller({ href }: { href: string }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let elapsed = 0;

    const stop = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };

    const schedule = () => {
      stop();
      if (document.hidden) return;
      const delay = delayFor(attempt);
      timer = setTimeout(() => {
        timer = null;
        elapsed += delay;
        attempt += 1;
        router.refresh();
        if (elapsed + delayFor(attempt) > POLL_MAX_MS) {
          setGaveUp(true);
          return;
        }
        schedule();
      }, delay);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (timer === null && elapsed + delayFor(attempt) <= POLL_MAX_MS) schedule();
    };

    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-start gap-2">
      <p role="status" className="text-muted-foreground">
        {gaveUp ? "Seguimos esperando la confirmación del pago." : "Consultando el estado…"}
      </p>
      <Link href={href} prefetch={false} className="text-sm font-medium text-foreground underline underline-offset-4">
        Consultar de nuevo
      </Link>
    </div>
  );
}
