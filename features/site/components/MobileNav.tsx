import { accountContext } from "@/features/account/server/session";
import { cartCount } from "@/features/cart/components/CartLink";
import { cartEnabled } from "@/features/cart/lib/flag";
import { MobileNavLinks } from "./MobileNavLinks";

export async function MobileNav() {
  const enabled = cartEnabled();
  const [ctx, count] = await Promise.all([accountContext(), enabled ? cartCount() : Promise.resolve(null)]);
  return <MobileNavLinks signedIn={ctx.session !== null} cartEnabled={enabled} cartCount={count} />;
}

export function MobileNavSkeleton() {
  return <div aria-hidden="true" className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-border bg-card md:hidden" />;
}
