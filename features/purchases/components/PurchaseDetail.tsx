import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRate, formatUsd, formatVes } from "@/lib/format";
import type { Purchase, StoreOrder } from "@/lib/marketplace/schemas";
import { OrderTracker } from "./OrderTracker";
import { chargeText, formatDateTime, FULFILLMENT_TEXT, ORDER_STATUS_TEXT, purchaseStatusText } from "../lib/labels";

// Los montos son las cadenas de la API formateadas: el reembolso y el envío no se restan ni se suman.

const ZERO = "0.00";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

function OrderCard({ order, paid }: { order: StoreOrder; paid: boolean }) {
  const { store } = order;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-lg font-bold tracking-tight">
            <Link
              href={`/tienda/${store.slug}`}
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {store.name}
            </Link>
          </h2>
          <span className="text-sm text-muted-foreground">{FULFILLMENT_TEXT[order.fulfillment]}</span>
          {/* El contrato no tiene estado de pedido antes del pago: sólo se muestra con la compra pagada. */}
          {paid && <Badge variant="secondary">{ORDER_STATUS_TEXT[order.status]}</Badge>}
        </div>

        {order.pickup_code !== null && (
          <div className="rounded-lg bg-primary-soft p-4">
            <p className="text-sm text-foreground">Código de retiro</p>
            <p className="text-3xl font-extrabold tracking-widest text-foreground">{order.pickup_code}</p>
          </div>
        )}

        {order.address !== null && (
          <div className="flex flex-col text-sm text-foreground">
            <p className="font-medium">Se entrega en {order.address.label}</p>
            <p>
              {order.address.line}, {order.address.city.name}
            </p>
            {order.address.reference !== null && <p>{order.address.reference}</p>}
            <p>
              {order.address.recipient_name} · {order.address.phone}
            </p>
          </div>
        )}

        <ul aria-label={`Productos de ${store.name}`} className="flex flex-col gap-2">
          {order.lines.map((line) => (
            <li key={line.product.slug} className="flex justify-between gap-4 text-sm">
              <span className="flex flex-col">
                <span className="text-foreground">
                  {line.product.name} <span className="text-muted-foreground">× {line.quantity}</span>
                </span>
                {line.missing && (
                  <Badge variant="warning" className="self-start">
                    Faltante · reembolsado
                  </Badge>
                )}
              </span>
              <span className="text-foreground">{formatUsd(line.line_usd)}</span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-1 border-t border-border pt-3">
          <Row label="Subtotal" value={`${formatUsd(order.subtotal_usd)} · ${formatVes(order.subtotal_ves)}`} />
          {order.fulfillment === "delivery" && (
            <Row label="Envío" value={`${formatUsd(order.delivery_fee_usd)} · ${formatVes(order.delivery_fee_ves)}`} />
          )}
          {(order.refunded_usd !== ZERO || order.refunded_ves !== ZERO) && (
            <Row label="Reembolsado" value={`${formatUsd(order.refunded_usd)} · ${formatVes(order.refunded_ves)}`} strong />
          )}
        </dl>

        {paid && <OrderTracker order={order} />}
      </CardContent>
    </Card>
  );
}

export function PurchaseDetail({ purchase }: { purchase: Purchase }) {
  const paid = purchase.status === "paid";
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={paid ? "secondary" : "warning"}>{purchaseStatusText(purchase)}</Badge>
            <span className="text-sm text-muted-foreground">{formatDateTime(purchase.created_at)}</span>
          </div>
          <dl className="flex flex-col gap-1">
            <Row label="Total" value={`${formatUsd(purchase.total_usd)} · ${formatVes(purchase.total_ves)}`} strong />
            <Row label="Cobrado" value={chargeText(purchase.charge)} />
          </dl>
          <p className="text-right text-sm text-muted-foreground">{formatRate(purchase.rate)}</p>
        </CardContent>
      </Card>
      {purchase.orders.map((order) => (
        <OrderCard key={order.store.slug} order={order} paid={paid} />
      ))}
    </div>
  );
}
