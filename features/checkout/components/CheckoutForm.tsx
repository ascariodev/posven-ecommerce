"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRate, formatUsd, formatVes } from "@/lib/format";
import type {
  Address,
  CartStore,
  Charge,
  DeliveryUnavailableReason,
  Quote,
  QuoteStore,
} from "@/lib/marketplace/schemas";
import { ResendVerificationForm } from "@/features/account/VerifyEmailForm";
import { payCheckout } from "../server/actions";
import { CheckoutEmpty } from "./CheckoutEmpty";
import { INITIAL_CHECKOUT_STATE } from "../lib/checkoutState";
import { checkoutHref, FULFILLMENT_PARAM_PREFIX } from "../lib/params";

// Los montos son las cadenas de la Quote y del carrito formateadas: aquí no se suma nada. "Cambió"
// compara cadenas de la Quote vieja y la nueva, sin calcular.

export const DELIVERY_UNAVAILABLE_TEXT: Record<DeliveryUnavailableReason, string> = {
  no_delivery: "Esta tienda no hace entregas.",
  out_of_radius: "Tu dirección está fuera de su zona de entrega.",
  no_address: "Agrega una dirección para pedir entrega.",
};

const ADD_ADDRESS_HREF = "/cuenta/direcciones?volver=/checkout";
const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

function chargeText(charge: Charge): string {
  return charge.currency === "VES" ? formatVes(charge.amount) : formatUsd(charge.amount);
}

function hasChanged(store: QuoteStore, previous: Quote | null): boolean {
  if (previous === null) return false;
  const before = previous.stores.find((entry) => entry.store_slug === store.store_slug);
  return before === undefined || before.total_usd !== store.total_usd || before.fulfillment !== store.fulfillment;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

function StoreSection({
  entry,
  store,
  changed,
  delivery,
  disabled,
  onFulfillment,
}: {
  entry: CartStore;
  store: QuoteStore;
  changed: boolean;
  delivery: boolean;
  disabled: boolean;
  onFulfillment: (delivery: boolean) => void;
}) {
  const reasonId = useId();
  const name = entry.store.name;
  const reason = store.delivery_unavailable_reason;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-lg font-bold tracking-tight">{name}</h2>
          {!entry.is_open && <Badge variant="secondary">Cerrada ahora</Badge>}
          {changed && <Badge variant="warning">Cambió</Badge>}
        </div>
        <ul aria-label={`Productos de ${name}`} className="flex flex-col gap-2">
          {entry.lines
            .filter((line) => line.status === "ok")
            .map((line) => (
              <li key={line.product.slug} className="flex justify-between gap-4 text-sm">
                <span className="text-foreground">
                  {line.product.name} <span className="text-muted-foreground">× {line.quantity}</span>
                </span>
                {line.line_usd !== null && <span className="text-foreground">{formatUsd(line.line_usd)}</span>}
              </li>
            ))}
        </ul>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-foreground">Entrega en {name}</legend>
          <RadioGroup
            value={delivery && store.delivery_available ? "delivery" : "pickup"}
            onValueChange={(value) => onFulfillment(value === "delivery")}
            disabled={disabled}
            aria-label={`Entrega en ${name}`}
          >
            <label className="flex min-h-11 items-center gap-3 text-sm text-foreground md:min-h-9">
              <RadioGroupItem value="pickup" />
              Retiro en tienda
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-foreground md:min-h-9">
              <RadioGroupItem
                value="delivery"
                disabled={!store.delivery_available}
                aria-describedby={reason === null ? undefined : reasonId}
              />
              Entrega a domicilio
            </label>
          </RadioGroup>
          {reason !== null && (
            <p id={reasonId} className="text-sm text-muted-foreground">
              {DELIVERY_UNAVAILABLE_TEXT[reason]}
            </p>
          )}
        </fieldset>
        <dl className="flex flex-col gap-1 border-t border-border pt-3">
          <Row label="Subtotal" value={`${formatUsd(store.subtotal_usd)} · ${formatVes(store.subtotal_ves)}`} />
          {store.fulfillment === "delivery" && (
            <Row label="Envío" value={`${formatUsd(store.delivery_fee_usd)} · ${formatVes(store.delivery_fee_ves)}`} />
          )}
          <Row label="Total de la tienda" value={`${formatUsd(store.total_usd)} · ${formatVes(store.total_ves)}`} strong />
        </dl>
      </CardContent>
    </Card>
  );
}

export function CheckoutForm({
  quote: initialQuote,
  stores,
  addresses,
  addressId,
  verified,
  idempotencyKey,
}: {
  quote: Quote;
  stores: CartStore[];
  addresses: Address[];
  addressId: number | null;
  verified: boolean;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const addressLabelId = useId();
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

  if (state.status === "cart_empty") return <CheckoutEmpty message={state.message} />;
  if (state.status === "instructions") {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-lg font-bold tracking-tight">Cómo pagar</h2>
          <p className="whitespace-pre-line text-foreground">{state.instructions}</p>
          <Link href={`/checkout/resultado?compra=${encodeURIComponent(state.purchaseCode)}`} className={linkClasses}>
            Ver el estado de tu compra
          </Link>
        </CardContent>
      </Card>
    );
  }

  const busy = updating || paying;
  const message = state.status === "idle" ? null : state.message;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <span id={addressLabelId} className="text-sm font-medium text-foreground">
            Dirección de entrega
          </span>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes direcciones guardadas.{" "}
              <Link href={ADD_ADDRESS_HREF} className={linkClasses}>
                Agregar dirección
              </Link>
            </p>
          ) : (
            <Select
              value={choice.addressId === null ? undefined : String(choice.addressId)}
              onValueChange={(value) => navigate({ ...choice, addressId: Number(value) })}
              disabled={busy}
            >
              <SelectTrigger className="w-full" aria-labelledby={addressLabelId}>
                <SelectValue placeholder="Elige una dirección" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={String(address.id)}>
                    {address.label}: {address.line}, {address.city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {quote.stores.map((store) => {
        const entry = stores.find((candidate) => candidate.store.slug === store.store_slug);
        if (entry === undefined) return null;
        return (
          <StoreSection
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

      <Card>
        <CardContent className="flex flex-col gap-3">
          <dl className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="text-2xl font-extrabold text-foreground">{formatUsd(quote.total_usd)}</dd>
            </div>
            <dd className="text-right text-foreground">{formatVes(quote.total_ves)}</dd>
            <dd className="text-right text-sm text-muted-foreground">Se cobrará {chargeText(quote.charge)}</dd>
            <dd className="text-right text-sm text-muted-foreground">{formatRate(quote.rate)}</dd>
          </dl>
          <p role="status" className="text-sm text-muted-foreground">
            {updating ? "Actualizando…" : ""}
          </p>
          {message !== null && (
            <p role="alert" className="text-sm font-medium text-foreground">
              {message}
            </p>
          )}
          {/* El servidor puede responder que el correo no está verificado aunque la página se pintó
              verificada (spec §6: aviso con "reenviar verificación"). */}
          {state.status === "email_unverified" && <ResendVerificationForm />}
          {verified && state.status !== "email_unverified" && (
            <form action={formAction}>
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
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {paying ? "Pagando…" : `Pagar ${chargeText(quote.charge)}`}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
