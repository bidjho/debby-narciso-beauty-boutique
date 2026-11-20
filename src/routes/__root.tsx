import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/shop/SiteHeader";
import { SiteFooter } from "@/components/shop/SiteFooter";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSiteContent } from "@/lib/site.functions";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-gold">Erro 404</p>
        <h1 className="mt-2 text-5xl font-semibold">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A página que procura não existe ou foi removida.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
            Ir para o início
          </Link>
          <Link to="/loja" className="inline-flex h-11 items-center rounded-full border border-input bg-card px-5 text-sm font-medium">
            Ver loja
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um problema. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
          <a href="/" className="inline-flex h-11 items-center rounded-full border border-input bg-card px-5 text-sm font-medium">
            Ir para o início
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FFF9F7" },
      { title: "Debby Narciso Cosmetics — Cosméticos em Nampula" },
      { name: "description", content: "Loja de cosméticos Debby Narciso em Nampula. Encomende pelo WhatsApp com entregas para todas as províncias de Moçambique." },
      { name: "author", content: "Debby Narciso Cosmetics" },
      { property: "og:site_name", content: "Debby Narciso Cosmetics" },
      { property: "og:locale", content: "pt_MZ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600&display=swap",
      },
    ],
  }),
  // Editable texts/contacts for header, footer and pages; refreshed after edits via router.invalidate().
  loader: async () => {
    try {
      return await getSiteContent();
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  },
  staleTime: 5 * 60_000,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-MZ">
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
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBackoffice = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {isBackoffice ? (
          <Outlet />
        ) : (
          <div className="flex min-h-screen flex-col">
            <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
              Saltar para o conteúdo
            </a>
            <SiteHeader />
            <main id="conteudo" className="flex-1">
              <Outlet />
            </main>
            <SiteFooter />
            <WhatsAppFab />
          </div>
        )}
        <Toaster position="top-center" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}
