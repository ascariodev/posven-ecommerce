import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState, emptyActionClass } from "@/components/EmptyState";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      headingLevel="h1"
      title="No encontramos esta página"
      description="Puede que el enlace haya cambiado o que la página ya no exista."
    >
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Ir al inicio
      </Link>
      <Link href="/buscar" className={emptyActionClass}>
        Buscar productos
      </Link>
    </EmptyState>
  );
}
