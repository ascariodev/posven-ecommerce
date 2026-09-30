"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LocationState } from "@/lib/marketplace/schemas";
import { clearLocation, setLocationCity, setLocationFromCoords } from "./actions";

type Mode = "summary" | "choose" | "select";

export function LocationPicker({
  label,
  states,
  onDone,
}: {
  label: string | null;
  states: LocationState[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("summary");
  const [message, setMessage] = useState<string | null>(null);
  const [stateSlug, setStateSlug] = useState("");
  const [municipalitySlug, setMunicipalitySlug] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const fieldId = useId();

  const municipalities = states.find((state) => state.slug === stateSlug)?.municipalities ?? [];
  const cities = municipalities.find((municipality) => municipality.slug === municipalitySlug)?.cities ?? [];

  function showCitySelector(text: string | null) {
    setMessage(text);
    setMode("select");
  }

  function requestCurrentPosition() {
    const geolocationFailed = () => showCitySelector("No pudimos obtener tu ubicación. Elige tu ciudad.");
    if (!("geolocation" in navigator)) {
      geolocationFailed();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await setLocationFromCoords(position.coords.latitude, position.coords.longitude);
          if (!result.ok) {
            geolocationFailed();
            return;
          }
          setMessage(null);
          setMode("summary");
          router.refresh();
          onDone?.();
        });
      },
      geolocationFailed,
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  function saveCity() {
    startTransition(async () => {
      const result = await setLocationCity(citySlug);
      if (!result.ok) {
        setMessage("No pudimos guardar esa ciudad. Elige otra.");
        return;
      }
      setMessage(null);
      setMode("summary");
      router.refresh();
      onDone?.();
    });
  }

  function removeLocation() {
    startTransition(async () => {
      await clearLocation();
      setMessage(null);
      setMode("summary");
      router.refresh();
      onDone?.();
    });
  }

  const showSummary = label !== null && mode === "summary";

  return (
    <div className="flex flex-col gap-3">
      {showSummary ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-foreground">Cerca de: {label}</p>
          <Button variant="outline" size="sm" onClick={() => setMode("choose")}>
            Cambiar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={requestCurrentPosition} disabled={isPending}>
            Usar mi ubicación
          </Button>
          <Button variant="outline" size="sm" onClick={() => showCitySelector(null)} disabled={isPending}>
            Elegir ciudad
          </Button>
        </div>
      )}

      {message !== null && (
        <p role="alert" className="text-sm text-foreground">
          {message}
        </p>
      )}

      {!showSummary && mode === "select" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveCity();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-state`} className="text-sm font-medium text-foreground">
              Estado
            </label>
            <Select
              value={stateSlug}
              onValueChange={(value) => {
                setStateSlug(value);
                setMunicipalitySlug("");
                setCitySlug("");
              }}
            >
              <SelectTrigger id={`${fieldId}-state`} className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.slug} value={state.slug}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-municipality`} className="text-sm font-medium text-foreground">
              Municipio
            </label>
            <Select
              value={municipalitySlug}
              disabled={municipalities.length === 0}
              onValueChange={(value) => {
                setMunicipalitySlug(value);
                setCitySlug("");
              }}
            >
              <SelectTrigger id={`${fieldId}-municipality`} className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality.slug} value={municipality.slug}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-city`} className="text-sm font-medium text-foreground">
              Ciudad
            </label>
            <Select value={citySlug} disabled={cities.length === 0} onValueChange={setCitySlug}>
              <SelectTrigger id={`${fieldId}-city`} className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={citySlug === "" || isPending}>
            Guardar
          </Button>
        </form>
      )}

      {label !== null && (
        <button
          type="button"
          className="self-start text-sm text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
          onClick={removeLocation}
          disabled={isPending}
        >
          Quitar ubicación
        </button>
      )}
    </div>
  );
}
