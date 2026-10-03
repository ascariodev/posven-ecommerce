import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCurrentCustomer } from "../server/session";

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function AccountIdentitySkeleton({ compact = false }: { compact?: boolean }) {
  return <Skeleton className={compact ? "h-14 w-full" : "h-20 w-full"} />;
}

export async function AccountIdentity({ compact = false }: { compact?: boolean }) {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className={cn("flex items-center gap-3", compact ? "py-2" : "pb-3")}>
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-foreground"
      >
        {initialsOf(customer.name)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-semibold text-foreground">{customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
        <Badge
          className={
            customer.email_verified
              ? "bg-tint-3 text-tint-3-foreground"
              : "bg-tint-1 text-tint-1-foreground"
          }
        >
          {customer.email_verified ? "Correo verificado" : "Correo sin verificar"}
        </Badge>
      </div>
    </div>
  );
}
