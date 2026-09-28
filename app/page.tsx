import { SITE_DESCRIPTION } from "@/lib/site";

export default function Home() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">
        Encuentra lo que buscas en tiendas cerca de ti
      </h1>
      <p className="text-lg text-muted-foreground">{SITE_DESCRIPTION}</p>
    </section>
  );
}
