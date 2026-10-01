import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { AccountSlot, AccountSlotSkeleton } from "@/features/account/AccountMenu";
import { CartLink, CartLinkSkeleton } from "@/features/cart/components/CartLink";
import { HeaderSearchSlot } from "@/features/search/components/HeaderSearchSlot";
import { SearchPill } from "@/features/search/components/SearchPill";
import { SiteFooter } from "@/features/site/components/SiteFooter";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const brandSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: productos cerca de ti`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: "#f7900a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${brandSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="header-elevate sticky top-0 z-40 border-b border-glass-border bg-glass backdrop-blur-md">
          <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
            <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
              {SITE_NAME}
            </Link>
            <Suspense fallback={null}>
              <HeaderSearchSlot>
                <div className="order-last flex w-full justify-center sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
                  <div className="w-full sm:max-w-xl">
                    <SearchPill compact degradeLocation />
                  </div>
                </div>
              </HeaderSearchSlot>
            </Suspense>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Suspense fallback={<CartLinkSkeleton />}>
                <CartLink />
              </Suspense>
              <Suspense fallback={<AccountSlotSkeleton />}>
                <AccountSlot />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
