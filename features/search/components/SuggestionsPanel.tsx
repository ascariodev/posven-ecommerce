import { Clock, Search, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatUsd, formatVes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PanelItem } from "../lib/panelItems";
import { ProductThumb } from "./ProductThumb";

const SECTIONS: { kind: PanelItem["kind"]; title: string }[] = [
  { kind: "term", title: "Sugerencias" },
  { kind: "product", title: "Productos" },
  { kind: "category", title: "Categorías" },
  { kind: "recent", title: "Recientes" },
];

const ROW = "flex min-h-11 items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-foreground";
const LEADING_ICON = "size-4 shrink-0 text-muted-foreground";

function Leading({ kind }: { kind: "term" | "recent" | "category" }) {
  if (kind === "recent") return <Clock aria-hidden="true" className={LEADING_ICON} />;
  if (kind === "category") return <Tag aria-hidden="true" className={LEADING_ICON} />;
  return <Search aria-hidden="true" className={LEADING_ICON} />;
}

export function SuggestionsPanel({
  id,
  items,
  activeIndex,
  onPick,
  onClearRecents,
}: {
  id: string;
  items: PanelItem[];
  activeIndex: number;
  onPick: (item: PanelItem) => void;
  onClearRecents?: () => void;
}) {
  const hasRecents = items.some((item) => item.kind === "recent");
  return (
    <div className="absolute inset-x-0 top-full z-50 mt-2 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-raised">
      <div id={id} role="listbox" aria-label="Sugerencias de búsqueda" className="min-h-0 overflow-y-auto p-2">
        {SECTIONS.map(({ kind, title }) => {
          const entries = items.map((item, index) => ({ item, index })).filter(({ item }) => item.kind === kind);
          if (entries.length === 0) return null;
          const headingId = `${id}-${kind}`;
          return (
            <div key={kind} role="group" aria-labelledby={headingId} className="py-1">
              <p
                id={headingId}
                className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {title}
              </p>
              {entries.map(({ item, index }) => (
                <Link
                  key={item.key}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  href={item.href}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPick(item)}
                  className={cn(ROW, "hover:bg-muted", index === activeIndex && "bg-muted")}
                >
                  {item.kind === "product" ? (
                    <>
                      <ProductThumb
                        imageUrl={item.item.image_url}
                        category={item.item.category}
                        size="md"
                        className="size-10"
                      />
                      <span className="min-w-0 flex-1 truncate">{item.item.name}</span>
                      <span className="shrink-0 text-right tabular-nums">
                        <span className="font-heading block font-bold text-primary-text">
                          {formatUsd(item.item.min_price_usd)}
                        </span>
                        <span className="block text-xs text-muted-foreground">{formatVes(item.item.min_price_ves)}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Leading kind={item.kind} />
                      <span className="min-w-0 flex-1 truncate">
                        {item.kind === "category" ? `${item.term} en ${item.label}` : item.label}
                      </span>
                    </>
                  )}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      {hasRecents && onClearRecents && (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClearRecents}
          >
            Borrar historial
          </Button>
        </div>
      )}
    </div>
  );
}
