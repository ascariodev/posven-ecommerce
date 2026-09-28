import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <Link href="/" className={buttonClasses("secondary")}>
        Ir al inicio
      </Link>
    </section>
  );
}
