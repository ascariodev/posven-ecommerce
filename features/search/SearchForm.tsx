import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <Form action="/buscar" role="search" className="flex w-full gap-2">
      <Input
        name="q"
        type="search"
        aria-label="Buscar productos"
        placeholder="Busca un producto, marca o código de barras"
        defaultValue={defaultQuery}
      />
      <Button type="submit">Buscar</Button>
    </Form>
  );
}
