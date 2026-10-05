import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProductDetail, Restriction } from "@/lib/marketplace/schemas";

const SALE_LABEL: Record<Restriction, string> = {
  none: "Libre, sin récipe",
  recipe: "Con récipe",
  controlled: "Controlada",
};

function DetailSection({
  title,
  rows,
  defaultOpen,
}: {
  title: string;
  rows: { label: string; value: string }[];
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-heading text-base font-bold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
        <h2 className="font-heading text-base font-bold">{title}</h2>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-foreground transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
        />
      </summary>
      <dl className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-border px-4 py-3">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function ProductDetails({ product }: { product: ProductDetail }) {
  const facts: { label: string; value: string }[] = [];
  if (product.brand !== null) facts.push({ label: "Marca", value: product.brand });
  if (product.category !== null) facts.push({ label: "Categoría", value: product.category.name });
  if (product.ean !== null) facts.push({ label: "Código de barras (EAN)", value: product.ean });
  facts.push({ label: "Venta", value: SALE_LABEL[product.restriction] });
  const attributes = product.attributes.map((attribute) => ({
    label: attribute.name,
    value: attribute.value,
  }));

  return (
    <Card className="gap-0 divide-y divide-border overflow-hidden border-border p-0 shadow-card">
      <DetailSection title="Detalles del producto" rows={facts} defaultOpen />
      {attributes.length > 0 && (
        <DetailSection title="Descripción y presentación" rows={attributes} defaultOpen={false} />
      )}
    </Card>
  );
}
