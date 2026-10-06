"use client";

import { useId, useSyncExternalStore } from "react";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeSwitch({ className, switchClassName }: { className?: string; switchClassName?: string }) {
  const id = useId();
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = hydrated && resolvedTheme === "dark";

  return (
    <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-sm", className)}>
      <Moon aria-hidden="true" className="size-4" />
      <span className="flex-1">Modo oscuro</span>
      <Switch
        id={id}
        className={switchClassName}
        checked={dark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </label>
  );
}
