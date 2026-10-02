"use client";

import { MapPin } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Address } from "@/lib/marketplace/schemas";
import { useFormValidation } from "@/hooks/useFormValidation";
import { saveAddress } from "../server/accountActions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../lib/formState";
import { addressSchema } from "../lib/formSchemas";

type City = { slug: string; name: string; state: string };
type Coords = { lat: number; lng: number };

const NO_COORDS_HELP =
  "Toca Usar mi ubicación para guardar la dirección. Sin ubicación sólo podrás retirar en tienda.";
const GEOLOCATION_FAILED =
  "No pudimos obtener tu ubicación. Revisa el permiso del navegador e intenta de nuevo.";

function groupByState(cities: City[]): { state: string; cities: City[] }[] {
  const groups = new Map<string, City[]>();
  for (const city of cities) {
    const group = groups.get(city.state);
    if (group === undefined) groups.set(city.state, [city]);
    else group.push(city);
  }
  return [...groups].map(([state, list]) => ({ state, cities: list }));
}

export function AddressForm({ address, cities }: { address: Address | null; cities: City[] }) {
  const [actionState, formAction, pending] = useActionState(saveAddress, INITIAL_FORM_STATE);
  const { onSubmit, onChange, state } = useFormValidation(addressSchema, actionState);
  const prefijo = useId();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  const [seenState, setSeenState] = useState(actionState);
  // Radix devuelve el Select al valor con que se montó cuando React resetea el formulario tras la
  // acción; montarlo de nuevo con cada respuesta le da el valor de la respuesta, como el
  // `defaultValue` de un campo nativo.
  const [responses, setResponses] = useState(0);
  if (seenState !== actionState) {
    setSeenState(actionState);
    setResponses((count) => count + 1);
    // Una dirección nueva guardada deja el formulario listo para la siguiente: pide la ubicación otra vez.
    if (actionState.status === "success" && address === null) {
      setCoords(null);
      setGeoFailed(false);
    }
  }

  const isNew = address === null;
  const value = (name: string, fallback: string): string => state.values[name] ?? fallback;
  const hasError = (name: string): boolean => state.fields[name] !== undefined;
  const describedBy = (name: string): string | undefined =>
    hasError(name) ? `${prefijo}-${name}-error` : undefined;
  const isDefault =
    actionState.status === "idle" ? (address?.is_default ?? false) : actionState.values.is_default === "on";
  const groups = groupByState(cities);

  function requestPosition() {
    if (!("geolocation" in navigator)) {
      setGeoFailed(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoFailed(false);
      },
      () => setGeoFailed(true),
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
      <input type="hidden" name="address_id" value={address?.id ?? ""} />
      <input type="hidden" name="lat" value={coords === null ? "" : String(coords.lat)} />
      <input type="hidden" name="lng" value={coords === null ? "" : String(coords.lng)} />
      <input type="hidden" name="coords_changed" value={coords === null ? "" : "1"} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-label`} className="text-sm font-medium text-foreground">
          Nombre de la dirección
        </label>
        <Input
          id={`${prefijo}-label`}
          name="label"
          type="text"
          placeholder="Casa, Trabajo"
          required
          defaultValue={value("label", address?.label ?? "")}
          aria-invalid={hasError("label") || undefined}
          aria-describedby={describedBy("label")}
        />
        <FieldError id={`${prefijo}-label-error`} state={state} name="label" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-recipient-name`} className="text-sm font-medium text-foreground">
          Quién recibe
        </label>
        <Input
          id={`${prefijo}-recipient-name`}
          name="recipient_name"
          type="text"
          autoComplete="name"
          required
          defaultValue={value("recipient_name", address?.recipient_name ?? "")}
          aria-invalid={hasError("recipient_name") || undefined}
          aria-describedby={describedBy("recipient_name")}
        />
        <FieldError id={`${prefijo}-recipient_name-error`} state={state} name="recipient_name" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-phone`} className="text-sm font-medium text-foreground">
          Teléfono
        </label>
        <Input
          id={`${prefijo}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          defaultValue={value("phone", address?.phone ?? "")}
          aria-invalid={hasError("phone") || undefined}
          aria-describedby={describedBy("phone")}
        />
        <FieldError id={`${prefijo}-phone-error`} state={state} name="phone" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-city`} className="text-sm font-medium text-foreground">
          Ciudad
        </label>
        <Select
          key={responses}
          name="city_slug"
          required
          defaultValue={value("city_slug", address?.city.slug ?? "") || undefined}
        >
          <SelectTrigger
            id={`${prefijo}-city`}
            className="w-full"
            aria-invalid={hasError("city_slug") || undefined}
            aria-describedby={describedBy("city_slug")}
          >
            <SelectValue placeholder="Elige tu ciudad" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.state}>
                <SelectLabel>{group.state}</SelectLabel>
                {group.cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <FieldError id={`${prefijo}-city_slug-error`} state={state} name="city_slug" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-line`} className="text-sm font-medium text-foreground">
          Dirección
        </label>
        <Input
          id={`${prefijo}-line`}
          name="line"
          type="text"
          autoComplete="street-address"
          required
          defaultValue={value("line", address?.line ?? "")}
          aria-invalid={hasError("line") || undefined}
          aria-describedby={describedBy("line")}
        />
        <FieldError id={`${prefijo}-line-error`} state={state} name="line" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-reference`} className="text-sm font-medium text-foreground">
          Punto de referencia (opcional)
        </label>
        <Input
          id={`${prefijo}-reference`}
          name="reference"
          type="text"
          defaultValue={value("reference", address?.reference ?? "")}
          aria-invalid={hasError("reference") || undefined}
          aria-describedby={describedBy("reference")}
        />
        <FieldError id={`${prefijo}-reference-error`} state={state} name="reference" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button type="button" variant="outline" size="sm" onClick={requestPosition}>
          <MapPin aria-hidden="true" className="size-4" />
          Usar mi ubicación
        </Button>
        <p role="status" className={geoFailed ? "text-sm text-warning" : "text-sm text-muted-foreground"}>
          {geoFailed ? GEOLOCATION_FAILED : coords !== null ? "Ubicación lista" : isNew ? NO_COORDS_HELP : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`${prefijo}-is-default`}
          name="is_default"
          type="checkbox"
          defaultChecked={isDefault}
          className="size-4 accent-primary"
        />
        <label htmlFor={`${prefijo}-is-default`} className="text-sm text-foreground">
          Usar como predeterminada
        </label>
      </div>
      <Button type="submit" disabled={pending || (isNew && coords === null)}>
        {pending ? "Guardando..." : "Guardar dirección"}
      </Button>
    </form>
  );
}
