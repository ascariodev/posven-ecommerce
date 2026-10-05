import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const emptyActionClass = cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-card");

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  headingLevel?: "h1" | "h2" | "h3";
  titleClassName?: string;
  description?: string;
  className?: string;
  compact?: boolean;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  headingLevel: Heading = "h2",
  titleClassName,
  description,
  className,
  compact = false,
  children,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "items-center text-center md:flex-row md:text-left",
        compact ? "gap-4 px-5 [--card-spacing:--spacing(4)] md:gap-5 md:px-6" : "gap-5 px-6 md:gap-8 md:px-10",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text",
          compact ? "size-14 md:size-16" : "size-22 md:size-30",
        )}
      >
        <Icon aria-hidden="true" className={cn("stroke-[1.5]", compact ? "size-6 md:size-7" : "size-10 md:size-13")} />
      </span>
      <div className={cn("flex min-w-0 flex-col", compact ? "gap-2" : "gap-3")}>
        <Heading
          className={cn(
            "font-heading font-semibold",
            compact ? "text-lg md:text-xl" : "text-[22px] md:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="mt-1 flex flex-col gap-2.5 sm:flex-row">{children}</div>
        ) : null}
      </div>
    </Card>
  );
}
