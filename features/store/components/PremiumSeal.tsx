import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function PremiumSeal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text",
        className,
      )}
    >
      <Handshake aria-hidden="true" className="size-3.5 shrink-0" />
      Aliado PosVen
    </span>
  );
}
