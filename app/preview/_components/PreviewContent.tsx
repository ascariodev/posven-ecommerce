import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/preview-ui/tabs";
import { getProductOffers, listCategories, listNearbyStores, searchProducts } from "@/lib/marketplace/client";
import type { Category } from "@/lib/marketplace/schemas";
import { DetailView, HomeView, SearchView } from "./PreviewViews";

function rootCategories(all: Category[], fromResults: Array<Category | null>): Category[] {
  if (all.length > 0) return all.filter((category) => category.parent_slug === null);
  const seen = new Map<string, Category>();
  for (const category of fromResults) {
    if (category !== null && !seen.has(category.slug)) seen.set(category.slug, category);
  }
  return [...seen.values()];
}

export async function PreviewContent() {
  const [search, stores, tree] = await Promise.all([
    searchProducts({ q: "a", category: null, geo: null, radiusKm: null, page: 1 }),
    listNearbyStores({ geo: null, radiusKm: null, page: 1 }),
    listCategories(),
  ]);
  const categories = rootCategories(
    tree,
    search.data.map((item) => item.category),
  );
  const sample = search.data.find((item) => item.offers_count > 1) ?? search.data[0];
  const detail =
    sample === undefined
      ? null
      : await getProductOffers({ slug: sample.slug, geo: null, radiusKm: null, sort: "price" });
  const page = detail !== null && "data" in detail ? detail : null;

  return (
    <Tabs defaultValue="inicio" className="gap-6">
      <TabsList>
        <TabsTrigger value="inicio">Inicio</TabsTrigger>
        <TabsTrigger value="busqueda">Búsqueda</TabsTrigger>
        <TabsTrigger value="ficha">Ficha</TabsTrigger>
      </TabsList>
      <TabsContent value="inicio">
        <HomeView categories={categories} search={search} stores={[...stores.featured, ...stores.data]} />
      </TabsContent>
      <TabsContent value="busqueda">
        <SearchView categories={categories} search={search} />
      </TabsContent>
      <TabsContent value="ficha">
        {page === null ? (
          <p className="text-muted-foreground">No hay un producto con ofertas para mostrar.</p>
        ) : (
          <DetailView page={page} />
        )}
      </TabsContent>
    </Tabs>
  );
}
