import Link from "next/link";
import { House, Plus } from "lucide-react";
import { useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Address } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

const ADD_ADDRESS_HREF = "/cuenta/direcciones?volver=/checkout";
export const SECTION_LABEL_CLASSES = "text-xs font-semibold tracking-wide text-muted-foreground uppercase md:text-sm";
export const LINK_CLASSES = "text-sm font-medium text-foreground underline underline-offset-4";

export function CheckoutAddressPicker({
  addresses,
  addressId,
  disabled,
  onChange,
}: {
  addresses: Address[];
  addressId: number | null;
  disabled: boolean;
  onChange: (addressId: number) => void;
}) {
  const headingId = useId();
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h2 id={headingId} className={SECTION_LABEL_CLASSES}>
          Dirección de entrega
        </h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes direcciones guardadas.{" "}
            <Link href={ADD_ADDRESS_HREF} className={LINK_CLASSES}>
              Agregar dirección
            </Link>
          </p>
        ) : (
          <>
            <RadioGroup
              value={addressId === null ? "" : String(addressId)}
              onValueChange={(value) => onChange(Number(value))}
              disabled={disabled}
              aria-labelledby={headingId}
              className="grid-cols-[minmax(0,1fr)] md:grid-cols-2"
            >
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex min-h-11 cursor-pointer gap-3 rounded-2xl border-2 border-border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft has-disabled:cursor-not-allowed"
                >
                  <RadioGroupItem value={String(address.id)} className="mt-0.5" />
                  <House aria-hidden="true" className="size-4.5 shrink-0 text-primary-text" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{address.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {address.line}, {address.city.name}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <Link href={ADD_ADDRESS_HREF} className={cn("inline-flex min-h-11 w-fit items-center gap-1.5 md:min-h-9", LINK_CLASSES)}>
              <Plus aria-hidden="true" className="size-4" />
              Agregar otra dirección
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
