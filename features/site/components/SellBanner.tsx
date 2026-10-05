import Image from "next/image";
import Link from "next/link";

export function SellBanner() {
  return (
    <section
      aria-labelledby="sell-title"
      className="relative flex min-h-64 items-center overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground sm:p-10 md:rounded-4xl"
    >
      <Image
        src="/brand/vende.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="object-cover object-right [mask-image:linear-gradient(to_right,transparent_25%,black_70%)]"
      />
      <div className="relative flex max-w-sm flex-col gap-3 sm:max-w-md">
        <span className="text-xs font-semibold text-primary">Para comercios</span>
        <h2 id="sell-title" className="font-heading text-2xl leading-tight font-semibold text-balance sm:text-3xl">
          Vende en posven y llega a los clientes de tu zona
        </h2>
        <p className="text-sm opacity-85">Activa tu tienda, muestra tus precios y recibe pedidos para retirar o entregar.</p>
        <Link
          href="/vende"
          className="inline-flex h-11 w-fit items-center rounded-lg bg-card px-5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
        >
          Vende con posven
        </Link>
      </div>
    </section>
  );
}
