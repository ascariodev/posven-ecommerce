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
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  headingLevel: Heading = "h2",
  titleClassName,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "items-center gap-5 px-6 text-center md:flex-row md:gap-8 md:px-10 md:text-left",
        className,
      )}
    >
      <span className="flex size-22 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text md:size-30">
        <Icon aria-hidden="true" className="size-10 stroke-[1.5] md:size-13" />
      </span>
      <div className="flex min-w-0 flex-col gap-3">
        <Heading className={cn("font-heading text-[22px] font-semibold md:text-3xl", titleClassName)}>{title}</Heading>
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
