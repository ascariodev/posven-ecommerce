"use client";

import { MapPin } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LocationState } from "@/lib/marketplace/schemas";
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

export function LocationSheet({
  label,
  compact = false,
}: {
  label: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<LocationState[] | null>(null);
  const [statesFailed, setStatesFailed] = useState(false);
  const loading = useRef(false);

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
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size={compact ? "sm" : "default"} className="shrink-0 rounded-full px-3" aria-label={label === null ? "¿Dónde? Ubicación: sin elegir" : `Ubicación: ${label}`}>
          <MapPin aria-hidden="true" className="size-4" />
          <span className="max-w-32 truncate">{label ?? "¿Dónde?"}</span>
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
