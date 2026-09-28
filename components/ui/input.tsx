import type { ComponentProps } from "react";
import { cx } from "./cx";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-md border border-input-border bg-background px-3 text-base text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
