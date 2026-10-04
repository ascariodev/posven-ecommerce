"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addRecent } from "../lib/recents";
import { SearchBox } from "./SearchBox";

export function SearchPill({ defaultQuery, compact = false }: { defaultQuery?: string; compact?: boolean }) {
  const formId = useId();
  const controlHeight = compact ? "h-11 md:h-9" : "h-11";

  function rememberQuery(event: FormEvent<HTMLFormElement>) {
    const q = new FormData(event.currentTarget).get("q");
    if (typeof q === "string") addRecent(q);
  }

  return (
    <div className="relative flex w-full max-w-2xl items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-raised">
      <Form action="/buscar" role="search" id={formId} onSubmit={rememberQuery} className="min-w-0 flex-1">
        <SearchBox
          defaultQuery={defaultQuery}
          className={cn(controlHeight, "rounded-full border-0 bg-transparent px-4 shadow-none", compact && "text-sm")}
        />
      </Form>
      <Button
        type="submit"
        form={formId}
        size={compact ? "sm" : "default"}
        aria-label="Buscar"
        className={cn(controlHeight, "shrink-0 rounded-full")}
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Buscar</span>
      </Button>
    </div>
  );
}
