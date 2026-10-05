import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, ORDER_STEP_STATE_TEXT } from "../lib/labels";
import { orderSteps, type TrackedOrder } from "../lib/orderSteps";

export function OrderTracker({ order, className }: { order: TrackedOrder; className?: string }) {
  const steps = orderSteps(order);
  if (steps === null) {
    return (
      <div className={cn("flex flex-col gap-1 rounded-2xl bg-warning-soft p-4 text-sm text-foreground", className)}>
        <p className="font-semibold">Pedido cancelado</p>
        {order.timeline.cancelled_at !== null && <p>{formatDateTime(order.timeline.cancelled_at)}</p>}
        {order.timeline.paid_at !== null && <p className="text-muted-foreground">Pagado el {formatDateTime(order.timeline.paid_at)}</p>}
      </div>
    );
  }
  return (
    <ol aria-label="Estado del pedido" className={cn("flex flex-col md:flex-row", className)}>
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.state === "now" ? "step" : undefined}
          className="relative flex gap-3 pb-5 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center"
        >
          {index < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-7 bottom-0 left-[13px] w-0.5 md:top-[13px] md:right-[calc(-50%+18px)] md:bottom-auto md:left-[calc(50%+18px)] md:h-0.5 md:w-auto",
                step.state === "done" ? "bg-success" : "bg-border",
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative flex size-7 shrink-0 items-center justify-center rounded-full",
              step.state === "done" && "bg-success text-background",
              step.state === "now" && "bg-primary ring-6 ring-primary-soft",
              step.state === "next" && "border-2 border-border",
            )}
          >
            {step.state === "done" && <Check className="size-3.5 stroke-3" />}
          </span>
          <span className="flex flex-col pt-0.5 md:pt-0">
            <span className={cn("text-sm text-foreground", step.state === "now" && "font-semibold", step.state === "next" && "text-muted-foreground")}>
              {step.label}
              {step.state !== "now" && <span className="sr-only">, {ORDER_STEP_STATE_TEXT[step.state]}</span>}
            </span>
            {step.at !== null && <span className="text-xs text-muted-foreground">{formatDateTime(step.at)}</span>}
            {step.hint !== null && <span className="text-xs text-muted-foreground md:hidden">{step.hint}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
