import { Search } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBox } from "./SearchBox";

export function SearchPill({ defaultQuery, compact = false }: { defaultQuery?: string; compact?: boolean }) {
  const formId = useId();
  const controlHeight = compact ? "h-11 md:h-9" : "h-11";

  return (
    <div className="relative flex w-full max-w-2xl items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-raised">
      <SearchBox
        formId={formId}
        defaultQuery={defaultQuery}
        className={cn(controlHeight, "rounded-full border-0 bg-transparent px-4 shadow-none", compact && "text-sm")}
      />
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
