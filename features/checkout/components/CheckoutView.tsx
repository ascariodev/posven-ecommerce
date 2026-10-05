import { connection } from "next/server";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/server/session";
import { ResendVerificationForm } from "@/features/account/components/VerifyEmailForm";
import { CheckoutEmpty } from "./CheckoutEmpty";
import { CheckoutForm } from "./CheckoutForm";
import { readCheckoutParams } from "../lib/params";
import { loadCheckout } from "../server/checkout";

export const EMAIL_UNVERIFIED_MESSAGE = "Verifica tu correo para comprar.";

export async function CheckoutView({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { customer, ctx } = await requireCustomer("/checkout");
  const data = await loadCheckout(ctx, readCheckoutParams(await searchParams));
  if (data.kind === "empty") return <CheckoutEmpty />;

  // Una clave por página pintada: cada reintento de esta página la reenvía igual (enmienda G).
  await connection();
  const idempotencyKey = crypto.randomUUID();

  return (
    <div className="flex flex-col gap-4">
      {!customer.email_verified && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-foreground">{EMAIL_UNVERIFIED_MESSAGE}</p>
            <ResendVerificationForm />
          </CardContent>
        </Card>
      )}
      <CheckoutForm
        key={data.quote.quote_hash}
        quote={data.quote}
        stores={data.stores}
        addresses={data.addresses}
        addressId={data.addressId}
        verified={customer.email_verified}
        hasBilling={customer.billing !== null}
        idempotencyKey={idempotencyKey}
      />
    </div>
  );
}

export function CheckoutViewSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 md:grid-cols-[minmax(0,1fr)_360px] md:gap-6">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
