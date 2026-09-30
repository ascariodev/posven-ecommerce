import { Search } from "lucide-react";
import Form from "next/form";
import { Suspense, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationBar, LocationBarSkeleton } from "@/features/location/LocationBar";
import { cn } from "@/lib/utils";

export function SearchPill({
  defaultQuery,
  compact = false,
  degradeLocation = false,
}: {
  defaultQuery?: string;
  compact?: boolean;
  degradeLocation?: boolean;
}) {
  const formId = useId();
  const controlHeight = compact ? "h-11 md:h-9" : "h-11";
  return (
    <div className="flex w-full max-w-2xl items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-raised">
      <Form action="/buscar" role="search" id={formId} className="min-w-0 flex-1">
        <Input
          name="q"
          type="search"
          aria-label="Buscar productos"
          placeholder="Producto o marca"
          defaultValue={defaultQuery}
          className={cn(controlHeight, "rounded-full border-0 bg-transparent px-4 shadow-none", compact && "text-sm")}
        />
      </Form>
      <Suspense fallback={<LocationBarSkeleton compact={compact} />}>
        <LocationBar compact={compact} degrade={degradeLocation} />
      </Suspense>
      <Button
        type="submit"
        form={formId}
        size={compact ? "sm" : "default"}
        aria-label="Buscar"
        className={cn(controlHeight, "shrink-0 rounded-full")}
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Buscar</span>
      </Button>
    </div>
  );
}
