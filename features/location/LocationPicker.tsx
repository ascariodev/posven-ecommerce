"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { LocationState } from "@/lib/marketplace/schemas";
import { clearLocation, setLocationCity, setLocationFromCoords } from "./actions";

type Mode = "summary" | "choose" | "select";

const selectClasses =
  "h-11 w-full rounded-md border border-input-border bg-surface px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50";

export function LocationPicker({ label, states }: { label: string | null; states: LocationState[] }) {
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
    });
  }

  function removeLocation() {
    startTransition(async () => {
      await clearLocation();
      setMessage(null);
      setMode("summary");
      router.refresh();
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
          className="grid gap-3 sm:grid-cols-4 sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            saveCity();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-state`} className="text-sm font-medium text-foreground">
              Estado
            </label>
            <select
              id={`${fieldId}-state`}
              className={selectClasses}
              value={stateSlug}
              onChange={(event) => {
                setStateSlug(event.target.value);
                setMunicipalitySlug("");
                setCitySlug("");
              }}
            >
              <option value="">Selecciona</option>
              {states.map((state) => (
                <option key={state.slug} value={state.slug}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-municipality`} className="text-sm font-medium text-foreground">
              Municipio
            </label>
            <select
              id={`${fieldId}-municipality`}
              className={selectClasses}
              value={municipalitySlug}
              disabled={municipalities.length === 0}
              onChange={(event) => {
                setMunicipalitySlug(event.target.value);
                setCitySlug("");
              }}
            >
              <option value="">Selecciona</option>
              {municipalities.map((municipality) => (
                <option key={municipality.slug} value={municipality.slug}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-city`} className="text-sm font-medium text-foreground">
              Ciudad
            </label>
            <select
              id={`${fieldId}-city`}
              className={selectClasses}
              value={citySlug}
              disabled={cities.length === 0}
              onChange={(event) => setCitySlug(event.target.value)}
            >
              <option value="">Selecciona</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
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
