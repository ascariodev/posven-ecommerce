"use client";

import { MessageCircle, Navigation, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { EventType, Restriction, StoreSummary } from "@/lib/marketplace/schemas";
import { SITE_NAME } from "@/lib/site";
import { sendBeaconEvent } from "./beacon";

type ContactProduct = { slug: string; name: string; restriction: Restriction };

function whatsappHref(whatsapp: string, product: ContactProduct | null): string {
  const message = product
    ? `Hola, vi ${product.name} en ${SITE_NAME}. ¿Lo tienen disponible?`
    : `Hola, los encontré en ${SITE_NAME}.`;
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function ContactButtons({ store, product }: { store: StoreSummary; product: ContactProduct | null }) {
  const track = (type: EventType) => () => {
    sendBeaconEvent({ type, store_slug: store.slug, product_slug: product?.slug ?? null });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {store.whatsapp !== null && product?.restriction !== "recipe" ? (
        <a
          href={whatsappHref(store.whatsapp, product)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp de ${store.name}`}
          className={buttonVariants()}
          onClick={track("click_whatsapp")}
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          WhatsApp
        </a>
      ) : null}
      {store.phone !== null ? (
        <a
          href={`tel:${store.phone}`}
          aria-label={`Llamar a ${store.name}`}
          className={buttonVariants({ variant: "outline" })}
          onClick={track("click_call")}
        >
          <Phone aria-hidden="true" className="size-4" />
          Llamar
        </a>
      ) : null}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ruta a ${store.name}`}
        className={buttonVariants({ variant: "outline" })}
        onClick={track("click_route")}
      >
        <Navigation aria-hidden="true" className="size-4" />
        Ver ruta
      </a>
    </div>
  );
}
