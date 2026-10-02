import { describe, expect, it } from "vitest";
import { breadcrumbListJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";

describe("serializeJsonLd", () => {
  it("reemplaza < para que un valor no cierre el script", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("<");
    expect(serialized).toBe('{"name":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
    expect(JSON.parse(serialized)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("breadcrumbListJsonLd", () => {
  it("numera desde 1 con URLs absolutas", () => {
    expect(
      breadcrumbListJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Farmacia Central", path: "/tienda/farmacia-central" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: new URL("/", SITE_URL).href },
        {
          "@type": "ListItem",
          position: 2,
          name: "Farmacia Central",
          item: `${new URL(SITE_URL).origin}/tienda/farmacia-central`,
        },
      ],
    });
  });
});
