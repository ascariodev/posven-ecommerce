"use client";

import Link from "next/link";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActionToast } from "@/hooks/useActionToast";
import { formatRate, formatUsd, formatVes } from "@/lib/format";
import type { Address, CartStore, Charge, Quote, QuoteStore } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { ResendVerificationForm } from "@/features/account/components/VerifyEmailForm";
import { payCheckout } from "../server/actions";
import { CheckoutAddressPicker, LINK_CLASSES, SECTION_LABEL_CLASSES } from "./CheckoutAddressPicker";
import { CheckoutEmpty } from "./CheckoutEmpty";
import { CheckoutStoreSection, DELIVERY_UNAVAILABLE_TEXT } from "./CheckoutStoreSection";
import { INITIAL_CHECKOUT_STATE } from "../lib/checkoutState";
import { checkoutHref, FULFILLMENT_PARAM_PREFIX } from "../lib/params";

// Los montos son las cadenas de la Quote y del carrito formateadas: aquí no se suma nada. "Cambió"
// compara cadenas de la Quote vieja y la nueva, sin calcular.

export { DELIVERY_UNAVAILABLE_TEXT };

const PROFILE_HREF = "/cuenta/perfil";

function chargeText(charge: Charge): string {
  return charge.currency === "VES" ? formatVes(charge.amount) : formatUsd(charge.amount);
}

function hasChanged(store: QuoteStore, previous: Quote | null): boolean {
  if (previous === null) return false;
  const before = previous.stores.find((entry) => entry.store_slug === store.store_slug);
  return before === undefined || before.total_usd !== store.total_usd || before.fulfillment !== store.fulfillment;
}

export function CheckoutForm({
  quote: initialQuote,
  stores,
  addresses,
  addressId,
  verified,
  hasBilling,
  idempotencyKey,
}: {
  quote: Quote;
  stores: CartStore[];
  addresses: Address[];
  addressId: number | null;
  verified: boolean;
  hasBilling: boolean;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const partsHeadingId = useId();
  const billToMeId = useId();
  const [billToMe, setBillToMe] = useState(hasBilling);
  const [updating, startTransition] = useTransition();
  const [state, formAction, paying] = useActionState(payCheckout, INITIAL_CHECKOUT_STATE);
  // La página monta este formulario con `key` = quote_hash: una Quote nueva del servidor lo reinicia.
  // Cada `quote_changed` reemplaza la Quote que se muestra, y "Cambió" compara contra la que se
  // mostraba justo antes (no contra la de la página), también tras dos cambios seguidos.
  const [shown, setShown] = useState<{ quote: Quote; previous: Quote | null }>({ quote: initialQuote, previous: null });
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.status === "quote_changed") setShown({ quote: state.quote, previous: shown.quote });
  }
  const { quote, previous } = shown;
  const [choice, setChoice] = useState(() => ({
    addressId,
    delivery: initialQuote.stores.filter((store) => store.fulfillment === "delivery").map((store) => store.store_slug),
  }));

  function navigate(next: { addressId: number | null; delivery: string[] }) {
    setChoice(next);
    startTransition(() => router.replace(checkoutHref(next.addressId, next.delivery), { scroll: false }));
  }

  const errorNotice = useMemo(
    () => (state.status === "error" ? { kind: "error" as const, message: state.message } : null),
    [state],
  );
  useActionToast(errorNotice);

  if (state.status === "cart_empty") return <CheckoutEmpty message={state.message} />;
  if (state.status === "instructions") {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-lg font-bold tracking-tight">Cómo pagar</h2>
          <p className="whitespace-pre-line text-foreground">{state.instructions}</p>
          <Link href={`/checkout/resultado?compra=${encodeURIComponent(state.purchaseCode)}`} className={LINK_CLASSES}>
            Ver el estado de tu compra
          </Link>
        </CardContent>
      </Card>
    );
  }

  const busy = updating || paying;
  const message =
    state.status === "quote_changed" || state.status === "email_unverified" || state.status === "billing_incomplete"
      ? state.message
      : null;
  const canPay = verified && state.status !== "email_unverified";

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)] items-start gap-5 md:grid-cols-[minmax(0,1fr)_360px] md:gap-6",
        canPay && "pb-28 md:pb-0",
      )}
    >
      <div className="flex flex-col gap-5">
        <CheckoutAddressPicker
          addresses={addresses}
          addressId={choice.addressId}
          disabled={busy}
          onChange={(nextAddressId) => navigate({ ...choice, addressId: nextAddressId })}
        />

        <section aria-labelledby={partsHeadingId} className="flex flex-col gap-3">
          <h2 id={partsHeadingId} className={SECTION_LABEL_CLASSES}>
            Cómo recibes cada parte
          </h2>
          {quote.stores.map((store) => {
            const entry = stores.find((candidate) => candidate.store.slug === store.store_slug);
            if (entry === undefined) return null;
            return (
              <CheckoutStoreSection
                key={store.store_slug}
                entry={entry}
                store={store}
                changed={hasChanged(store, previous)}
                delivery={choice.delivery.includes(store.store_slug)}
                disabled={busy}
                onFulfillment={(delivery) =>
                  navigate({
                    ...choice,
                    delivery: delivery
                      ? [...choice.delivery.filter((slug) => slug !== store.store_slug), store.store_slug]
                      : choice.delivery.filter((slug) => slug !== store.store_slug),
                  })
                }
              />
            );
          })}
        </section>
      </div>

      <Card className="md:sticky md:top-24">
        <CardContent className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">Tu pedido</h2>
          <dl className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-heading text-2xl font-extrabold tabular-nums text-foreground">{formatUsd(quote.total_usd)}</dd>
            </div>
            <dd className="text-right tabular-nums text-foreground">{formatVes(quote.total_ves)}</dd>
            <dd className="text-right text-sm text-muted-foreground">Se cobrará {chargeText(quote.charge)}</dd>
            <dd className="text-right text-sm text-muted-foreground">{formatRate(quote.rate)}</dd>
          </dl>
          <p role="status" className="text-sm text-muted-foreground">
            {updating ? "Actualizando…" : ""}
          </p>
          {message !== null && (
            <p role="alert" className="text-sm font-medium text-foreground">
              {message}
              {state.status === "billing_incomplete" && (
                <>
                  {" "}
                  <Link href={PROFILE_HREF} className={LINK_CLASSES}>
                    Completar mis datos
                  </Link>
                </>
              )}
            </p>
          )}
          {/* El servidor puede responder que el correo no está verificado aunque la página se pintó
              verificada (spec §6: aviso con "reenviar verificación"). */}
          {state.status === "email_unverified" && <ResendVerificationForm />}
          {canPay && (
            <form action={formAction} className="flex flex-col gap-3">
              {/* La dirección y las entregas son las de la Quote que se muestra, no las que se eligen
                  mientras llega la nueva ("Pagar" está deshabilitado entretanto). */}
              <input type="hidden" name="address_id" value={addressId ?? ""} />
              {quote.stores.map((store) => (
                <span key={store.store_slug} hidden>
                  <input type="hidden" name="store_slug" value={store.store_slug} />
                  <input type="hidden" name={`${FULFILLMENT_PARAM_PREFIX}${store.store_slug}`} value={store.fulfillment} />
                </span>
              ))}
              <input type="hidden" name="quote_hash" value={quote.quote_hash} />
              <input type="hidden" name="idempotency_key" value={idempotencyKey} />
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <span className={SECTION_LABEL_CLASSES}>Facturación</span>
                <div className="flex min-h-11 items-center gap-2 md:min-h-9">
                  <input
                    id={billToMeId}
                    name="bill_to_me"
                    type="checkbox"
                    checked={hasBilling && billToMe}
                    disabled={!hasBilling}
                    onChange={(event) => setBillToMe(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <label htmlFor={billToMeId} className="text-sm text-foreground">
                    Factura a mi nombre
                  </label>
                </div>
                {!hasBilling && (
                  <p className="text-sm text-muted-foreground">
                    Sin datos de facturación la compra sale a consumidor final.{" "}
                    <Link href={PROFILE_HREF} className={LINK_CLASSES}>
                      Agregar mis datos
                    </Link>
                  </p>
                )}
              </div>
              {/* En móvil el botón queda fijo sobre la navegación inferior; desde md, dentro del resumen. */}
              <div
                data-testid="checkout-pay-bar"
                className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card px-4 py-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0"
              >
                <Button type="submit" size="lg" className="w-full bg-success text-background hover:bg-success/90 shadow-raised" disabled={busy}>
                  <LockIcon aria-hidden className="mr-2 h-4 w-4" />
                  {paying ? "Procesando pago seguro…" : `Pagar ${chargeText(quote.charge)} de forma segura`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
