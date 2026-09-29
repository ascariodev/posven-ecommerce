import type { ComponentProps } from "react";
import { cx } from "./cx";

export type InputSize = "md" | "sm";

const sizeClasses: Record<InputSize, string> = {
  md: "h-11 text-base",
  sm: "h-9 text-sm",
};

export type InputProps = ComponentProps<"input"> & {
  inputSize?: InputSize;
};

export function Input({ inputSize = "md", className, ...props }: InputProps) {
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-input-border bg-surface px-3 text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        "disabled:opacity-50",
        sizeClasses[inputSize],
        className,
      )}
      {...props}
    />
  );
}
