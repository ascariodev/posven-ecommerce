import type { ComponentProps } from "react";
import { cx } from "./cx";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-2xl border border-border bg-surface p-4 shadow-card", className)}
      {...props}
    />
  );
}
