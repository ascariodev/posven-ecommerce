import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountIdentity, AccountIdentitySkeleton } from "@/features/account/components/AccountIdentity";
import { AccountNav, AccountNavSkeleton } from "@/features/account/components/AccountNav";
import { cartEnabled } from "@/features/cart/lib/flag";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/cuenta">) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
      <Suspense fallback={<AccountNavSkeleton />}>
        <AccountNav
          showPurchases={cartEnabled()}
          identity={
            <Suspense fallback={<AccountIdentitySkeleton />}>
              <AccountIdentity />
            </Suspense>
          }
          compactIdentity={
            <Suspense fallback={<AccountIdentitySkeleton compact />}>
              <AccountIdentity compact />
            </Suspense>
          }
        />
      </Suspense>
      <div className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-card lg:p-6">{children}</div>
    </div>
  );
}
