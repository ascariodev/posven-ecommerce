import type { ComponentProps } from "react";
import { cx } from "./cx";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div aria-hidden="true" className={cx("animate-pulse rounded-md bg-muted", className)} {...props} />
  );
}
