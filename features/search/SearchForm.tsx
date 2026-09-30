import { Search } from "lucide-react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function SearchForm({
  defaultQuery,
  size = "lg",
}: {
  defaultQuery?: string;
  size?: "lg" | "sm";
}) {
  const large = size === "lg";
  return (
    <Form
      action="/buscar"
      role="search"
      className={cn(
        "flex w-full gap-2",
        large ? "rounded-lg border border-glass-border bg-glass p-2 shadow-card backdrop-blur-md" : "items-center",
      )}
    >
      <Input
        name="q"
        type="search"
        aria-label="Buscar productos"
        placeholder="Busca un producto, marca o código de barras"
        defaultValue={defaultQuery}
        className={large ? undefined : "h-9 text-sm"}
      />
      <Button type="submit" size={large ? "default" : "sm"}>
        <Search aria-hidden="true" className="size-4" />
        Buscar
      </Button>
    </Form>
  );
}
