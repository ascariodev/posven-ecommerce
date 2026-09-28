import type { ComponentProps } from "react";
import { cx } from "./cx";

export type BadgeVariant = "neutral" | "featured" | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-foreground",
  featured: "bg-primary text-primary-foreground",
  warning: "bg-featured text-warning",
};

export type BadgeProps = ComponentProps<"span"> & { variant?: BadgeVariant };

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
