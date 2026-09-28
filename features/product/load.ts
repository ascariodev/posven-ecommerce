import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import { getProduct } from "@/lib/marketplace/client";
import type { ProductPage } from "@/lib/marketplace/schemas";

export async function loadProduct(slug: string): Promise<ProductPage> {
  const response = await getProduct(slug);
  if (response === null) notFound();
  if ("redirect_to" in response) permanentRedirect(`/p/${response.redirect_to}`);
  return response;
}
