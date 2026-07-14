import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "../lib/cart";
import { AuthProvider } from "../lib/auth";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { AnnouncementBar } from "../components/site/AnnouncementBar";
import { WhatsAppFab } from "../components/site/WhatsAppFab";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-blush-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-medium text-charcoal">404</h1>
        <h2 className="mt-4 font-serif text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="bg-rose-gradient text-primary-foreground inline-flex rounded-full px-6 py-3 text-sm tracking-wide shadow-luxe"
          >
            Return home
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
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="border-input rounded-full border bg-background px-5 py-2.5 text-sm"
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
      { title: "VAARAHI — Luxury Jewellery, Fashion & Accessories" },
      {
        name: "description",
        content:
          "Discover VAARAHI — a curated house of handcrafted luxury jewellery, bangles, handbags, cosmetics and gifting for the modern Indian woman.",
      },
      { name: "author", content: "VAARAHI" },
      { property: "og:title", content: "VAARAHI — Luxury Jewellery, Fashion & Accessories" },
      {
        property: "og:description",
        content: "Premium handcrafted jewellery, bangles, handbags and beauty — curated with love.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "VAARAHI — Luxury Jewellery, Fashion & Accessories" },
      { name: "twitter:description", content: "Premium handcrafted jewellery, bangles, handbags and beauty — curated with love." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <AnnouncementBar />
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <WhatsAppFab />
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
