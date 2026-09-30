import { MapPin, Phone, Navigation, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";
import { Badge } from "@/components/preview-ui/badge";
import { Button, buttonVariants } from "@/components/preview-ui/button";
import { Card, CardContent } from "@/components/preview-ui/card";
import { Input } from "@/components/preview-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/preview-ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/preview-ui/sheet";
import { categoryIcon } from "@/features/search/categoryIcon";
import { formatDistance, formatRate, formatUsd, formatVes } from "@/lib/format";
import type {
  Category,
  NearbyStore,
  ProductPage,
  SearchResponse,
} from "@/lib/marketplace/schemas";
import { PreviewCard } from "./PreviewCard";
import { PreviewThumb } from "./PreviewThumb";

function SearchPill() {
  return (
    <form
      action="/buscar"
      className="flex max-w-2xl items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-raised"
    >
      <Input
        name="q"
        aria-label="Buscar un producto, marca o código de barras"
        placeholder="Producto, marca o código de barras"
        className="h-11 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
      />
      <Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="Buscar">
        <Search aria-hidden="true" />
      </Button>
    </form>
  );
}

function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <nav aria-label="Categorías" className="flex gap-1 overflow-x-auto border-b border-border pb-1">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/buscar?categoria=${encodeURIComponent(category.slug)}`}
          className="flex shrink-0 flex-col items-center gap-1.5 border-b-2 border-transparent px-4 pb-2 pt-1 text-sm font-medium text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-6" })}
          {category.name}
        </Link>
      ))}
    </nav>
  );
}

function StoreTile({ store }: { store: NearbyStore }) {
  const initials = store.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <Link href={`/tienda/${store.slug}`} className="rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="gap-0 py-0 transition duration-200 hover:shadow-raised motion-reduce:transition-none">
        <div aria-hidden="true" className="h-20 bg-linear-to-r from-amber-200 via-orange-300 to-orange-400" />
        <CardContent className="-mt-7 flex items-end justify-between gap-3 pb-4">
          <div className="flex items-end gap-3">
            <span className="flex size-14 items-center justify-center rounded-full border-4 border-card bg-primary-soft text-lg font-bold text-warning">
              {initials}
            </span>
            <div className="pb-1">
              <p className="font-semibold text-foreground">{store.name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3.5" />
                {store.city.name}
                {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function HomeView({
  categories,
  search,
  stores,
}: {
  categories: Category[];
  search: SearchResponse;
  stores: NearbyStore[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Encuentra lo que buscas en tiendas cerca de ti
        </h1>
        <p className="text-muted-foreground">Compara precios en dólares y bolívares antes de salir.</p>
        <SearchPill />
      </section>
      <CategoryRail categories={categories} />
      <section aria-labelledby="cerca" className="flex flex-col gap-4">
        <h2 id="cerca" className="text-xl font-bold tracking-tight text-foreground">
          Cerca de ti
        </h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
          {search.data.slice(0, 8).map((item) => (
            <li key={item.slug}>
              <PreviewCard item={item} />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="tiendas" className="flex flex-col gap-4">
        <h2 id="tiendas" className="text-xl font-bold tracking-tight text-foreground">
          Tiendas
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.slug}>
              <StoreTile store={store} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SearchView({ categories, search }: { categories: Category[]; search: SearchResponse }) {
  return (
    <div className="flex flex-col gap-5">
      <SearchPill />
      <div className="flex flex-wrap items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal aria-hidden="true" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Categoría, distancia y tienda. Los filtros reales se conectan en el plan 2.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        {categories.slice(0, 5).map((category) => (
          <Link
            key={category.slug}
            href={`/buscar?categoria=${encodeURIComponent(category.slug)}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
          >
            {category.name}
          </Link>
        ))}
        <div className="ml-auto w-44">
          <Select defaultValue="relevancia">
            <SelectTrigger aria-label="Ordenar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevancia">Relevancia</SelectItem>
              <SelectItem value="precio">Menor precio</SelectItem>
              <SelectItem value="cerca">Más cerca</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {search.meta.total} productos
        </h2>
        <p className="text-sm text-muted-foreground">{formatRate(search.rate)}</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
        {search.data.map((item) => (
          <li key={item.slug}>
            <PreviewCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const availabilityLabel = { available: "Disponible", low: "Pocas unidades" } as const;

export function DetailView({ page }: { page: ProductPage }) {
  const { data, offers, rate } = page;
  const { low_price_usd: low, high_price_usd: high } = data.offers_summary;
  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <PreviewThumb
        imageUrl={data.image_url}
        category={data.category}
        alt={data.name}
        className="aspect-square rounded-3xl"
        iconClassName="size-24"
      />
      <Card className="gap-5 p-5 md:sticky md:top-24">
        <div className="flex flex-col gap-2">
          {data.category !== null && <Badge variant="secondary">{data.category.name}</Badge>}
          <h1 className="text-2xl font-extrabold tracking-tight text-balance text-foreground">{data.name}</h1>
          {data.brand !== null && <p className="text-muted-foreground">{data.brand}</p>}
          {low !== null && (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm text-muted-foreground">Desde</span>
              <span className="text-3xl font-extrabold text-foreground">{formatUsd(low)}</span>
              {high !== null && high !== low && (
                <span className="text-sm text-muted-foreground">hasta {formatUsd(high)}</span>
              )}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{formatRate(rate)}</p>
        </div>
        <ul aria-label="Tiendas" className="flex flex-col gap-3">
          {offers.map((offer, index) => (
            <li
              key={offer.store.slug}
              className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 ${index === 0 ? "border-emerald-700 ring-1 ring-emerald-700" : "border-border"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                    {offer.store.name}
                    {index === 0 && <Badge className="bg-emerald-100 text-emerald-900">Mejor precio</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {offer.store.city.name}
                    {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
                  </p>
                  <Badge variant={offer.availability === "low" ? "outline" : "secondary"} className="mt-2">
                    {availabilityLabel[offer.availability]}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{formatUsd(offer.price_usd)}</p>
                  <p className="text-sm text-muted-foreground">{formatVes(offer.price_ves)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {offer.store.phone !== null && (
                  <a href={`tel:${offer.store.phone}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Phone aria-hidden="true" />
                    Llamar
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${offer.store.latitude},${offer.store.longitude}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Navigation aria-hidden="true" />
                  Ver ruta
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
