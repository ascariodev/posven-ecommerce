import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
