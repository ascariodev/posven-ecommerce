import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-8 shadow-card">
      <h1 className="text-3xl font-bold tracking-tight">No encontramos esta página</h1>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Ir al inicio
      </Link>
    </section>
  );
}
