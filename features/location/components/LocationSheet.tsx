"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LocationState } from "@/lib/marketplace/schemas";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS } from "@/lib/marketplace/params";
import { cn } from "@/lib/utils";
import { loadLocationStates } from "../server/actions";
import { LocationPicker } from "./LocationPicker";

const DESKTOP_QUERY = "(min-width: 40rem)";

function subscribeToDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

function radiusDetail(kind: "city" | "coords", radio: string | null): string | null {
  if (radio === "pais") return "Todo el país";
  if (kind === "city") return null;
  const km = RADIUS_OPTIONS.find((option) => String(option) === radio) ?? DEFAULT_RADIUS_KM;
  return `${km} km`;
}

export function LocationSheet({
  label,
  kind = "city",
}: {
  label: string | null;
  kind?: "city" | "coords";
}) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<LocationState[] | null>(null);
  const [statesFailed, setStatesFailed] = useState(false);
  const loading = useRef(false);
  const radio = useSearchParams()?.get("radio") ?? null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next || states !== null || loading.current) return;
    loading.current = true;
    setStatesFailed(false);
    loadLocationStates()
      .then((loaded) => {
        if (loaded === null) setStatesFailed(true);
        else setStates(loaded);
      })
      .catch(() => setStatesFailed(true))
      .finally(() => {
        loading.current = false;
      });
  }

  const side = useIsDesktop() ? "right" : "bottom";
  const detail = label === null ? null : radiusDetail(kind, radio);
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 min-w-0 flex-1 basis-0 justify-start gap-2 rounded-xl px-2 text-left md:flex-none md:basis-auto"
        >
          <MapPin aria-hidden="true" className="size-5 text-primary-text" />
          <span className="flex min-w-0 max-w-40 flex-col items-start leading-tight sm:max-w-56">
            <span className="text-xs font-medium text-muted-foreground">Buscar cerca de</span>{" "}
            <span className="flex max-w-full items-center gap-1 text-sm">
              <span className="truncate">{label === null ? "Elegir ubicación" : detail === null ? label : `${label} · ${detail}`}</span>
              <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
            </span>
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className={cn(side === "bottom" && "rounded-t-3xl")}>
        <SheetHeader>
          <SheetTitle>Tu ubicación</SheetTitle>
          <SheetDescription>Buscamos tiendas cerca de este lugar.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <LocationPicker label={label} states={states} statesFailed={statesFailed} onDone={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
