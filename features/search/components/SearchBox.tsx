"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import type { RadiusKm } from "@/lib/marketplace/params";
import { buildPanelItems, type PanelItem } from "../lib/panelItems";
import { parseSearchQuery } from "../lib/query";
import { addRecent, readRecents } from "../lib/recents";
import { useSuggestions } from "../lib/useSuggestions";
import { SuggestionsPanel } from "./SuggestionsPanel";

function currentRadio(): RadiusKm | null {
  if (typeof window === "undefined") return null;
  return parseSearchQuery(Object.fromEntries(new URLSearchParams(window.location.search))).radio;
}

export function SearchBox({ defaultQuery = "", className }: { defaultQuery?: string; className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);
  const radio = currentRadio();
  const data = useSuggestions(value, radio);
  const items = open ? buildPanelItems({ query: value, data, recents, radio }) : [];
  const expanded = items.length > 0;
  const active = activeIndex < items.length ? activeIndex : -1;

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function pick(item: PanelItem) {
    if (item.kind === "term" || item.kind === "recent") addRecent(item.label);
    close();
  }

  function openPanel() {
    setRecents(readRecents());
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open) openPanel();
      if (items.length === 0) return;
      event.preventDefault();
      const slots = items.length + 1;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(((active + 1 + step + slots) % slots) - 1);
      return;
    }
    if (event.key === "Enter" && expanded && active >= 0) {
      event.preventDefault();
      const item = items[active];
      pick(item);
      router.push(item.href);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }

  return (
    <div onBlur={handleBlur}>
      <Input
        name="q"
        type="search"
        role="combobox"
        aria-label="Buscar productos"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-option-${active}` : undefined}
        autoComplete="off"
        placeholder="Producto o marca"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(-1);
          if (!open) openPanel();
        }}
        onFocus={openPanel}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {expanded && <SuggestionsPanel id={listId} items={items} activeIndex={active} onPick={pick} />}
    </div>
  );
}
