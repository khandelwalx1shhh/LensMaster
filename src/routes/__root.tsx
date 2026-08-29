import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,

  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { useCartSync } from "@/hooks/useCartSync";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-light">404</h1>
        <h2 className="mt-4 font-display text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#111111" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "author", content: "Lens Master by The Swadesh" },
      { name: "keywords", content: "eyewear jaipur, optical store jaipur, ray-ban jaipur, gucci glasses, prescription glasses, sunglasses, blue light glasses, contact lenses, lens master, opticians jaipur, spectacles jaipur" },
      { name: "geo.region", content: "IN-RJ" },
      { name: "geo.placename", content: "Jaipur" },
      { property: "og:site_name", content: "Lens Master" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico?v=2", type: "image/x-icon" },
      { rel: "preconnect", href: "https://cdn.shopify.com" },
      { rel: "preconnect", href: "https://img.logo.dev" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Optician",
          name: "Lens Master by The Swadesh",
          image: "/favicon.ico",
          "@id": "https://lensmaster.in/#store",
          url: "https://lensmaster.in/",
          telephone: "+91-98292-30548",
          priceRange: "₹₹",
          address: {
            "@type": "PostalAddress",
            streetAddress: "B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi",
            addressLocality: "Jaipur",
            addressRegion: "Rajasthan",
            postalCode: "302015",
            addressCountry: "IN",
          },
          geo: { "@type": "GeoCoordinates", latitude: 26.8824981, longitude: 75.8000534 },
          openingHoursSpecification: [
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "10:30", closes: "21:00" },
            { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:30", closes: "19:00" },
          ],
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "700" },
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppFrame() {
  useCartSync();
  const { pathname } = useRouterState({ select: (s) => s.location });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return (
      <>
        <Outlet />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <Toaster position="top-center" richColors />
    </>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame />
    </QueryClientProvider>
  );
}
