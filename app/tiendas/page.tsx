import type { Metadata } from "next";
import { Suspense } from "react";
import { StoresDirectory, StoresDirectorySkeleton } from "@/features/store/components/StoresDirectory";

export const metadata: Metadata = {
  title: "Tiendas",
  description: "Comercios con sus precios en dólares y bolívares, ordenados por cercanía.",
  alternates: { canonical: "/tiendas" },
};

export default function StoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">Tiendas</h1>
      <Suspense fallback={<StoresDirectorySkeleton />}>
        <StoresDirectory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
