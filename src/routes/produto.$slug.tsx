import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ImageOff, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { availabilityLabel, effectivePrice, hasValidPromo, isOutOfStock, maxOrderable } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-config";
import { useSite } from "@/lib/use-site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shop/EmptyState";
import { PriceTag } from "@/components/shop/PriceTag";
import { ProductGrid } from "@/components/shop/ProductCard";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    const data = await getProductBySlug({ data: { slug: params.slug } });
    if (!data.product) throw notFound();
    return { product: data.product, related: data.related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Produto indisponível — Debby Narciso Cosméticos" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    const desc = (p.description ?? `${p.name} — Debby Narciso Cosmetics, Nampula.`).slice(0, 155);
    const out = isOutOfStock(p);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      ...(p.description ? { description: p.description } : {}),
      ...(p.category ? { category: p.category.name } : {}),
      brand: { "@type": "Brand", name: STORE.name },
      offers: {
        "@type": "Offer",
        priceCurrency: "MZN",
        price: effectivePrice(p).toFixed(2),
        availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        seller: { "@type": "Organization", name: STORE.name },
      },
    };
    return {
      meta: [
        { title: `${p.name} — Debby Narciso Cosméticos` },
        { name: "description", content: desc },
        { property: "og:title", content: p.name },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: ProductPage,
  errorComponent: ProductError,
  notFoundComponent: () => (
    <div className="container-shop py-20 text-center">
      <h1 className="text-4xl font-semibold">Produto não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Este produto não existe ou já não está disponível.</p>
      <Button asChild className="mt-6"><Link to="/loja">Ver a loja</Link></Button>
    </div>
  ),
});

function ProductError() {
  const router = useRouter();
  return (
    <div className="container-shop py-12">
      <EmptyState title="Não foi possível carregar o produto" description="Verifique a sua ligação e tente novamente." action={<Button onClick={() => router.invalidate()}>Tentar novamente</Button>} />
    </div>
  );
}

function ProductPage() {
  const data = Route.useLoaderData();
  const { contact } = useSite();
  const product = data.product;
  const { add } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  useEffect(() => {
    setActive(0);
    setQty(1);
  }, [product.id]);
  const max = maxOrderable(product);
  const out = isOutOfStock(product);
  const images = product.images;

  function onAdd(goToCart: boolean) {
    const { added, capped } = add(product, qty);
    if (added === 0) {
      toast.error(capped ? "Já tem no carrinho todo o stock disponível deste produto." : "Não foi possível adicionar.");
      return;
    }
    toast.success(`${product.name} adicionado ao carrinho`, {
      description: capped ? "Quantidade ajustada ao stock disponível." : undefined,
      action: { label: "Ver carrinho", onClick: () => navigate({ to: "/carrinho" }) },
    });
    setQty(1);
    if (goToCart) navigate({ to: "/carrinho" });
  }

  return (
    <div className="container-shop py-6 md:py-12">
      <nav className="mb-4 text-sm" aria-label="Navegação">
        <Link to="/loja" search={product.category ? { categoria: product.category.slug } : {}} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
          <ChevronLeft className="size-4" aria-hidden /> {product.category ? product.category.name : "Loja"}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-blush">
            {images[active] ? (
              <img src={images[active].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="size-10" aria-hidden /><span className="sr-only">Sem fotografia</span></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Fotografias do produto">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Ver fotografia ${i + 1}`}
                  aria-current={i === active}
                  className={cn("size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-blush", i === active ? "border-primary" : "border-transparent opacity-70")}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <p className="eyebrow text-gold">{product.category.name}</p>}
          <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <PriceTag product={product} size="lg" />
            {hasValidPromo(product) && <Badge variant="promo">Promoção</Badge>}
          </div>
          <p className={cn("mt-2 text-sm font-medium", out ? "text-muted-foreground" : "text-success")}>{availabilityLabel(product)}</p>

          {product.description && (
            <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{product.description}</div>
          )}

          <div className="mt-8 space-y-3">
            {!out && (
              <div className="flex items-center gap-3">
                <QuantityStepper value={qty} onChange={(v) => setQty(Math.max(1, max === null ? v : Math.min(v, max)))} max={max} />
                {max !== null && <span className="text-xs text-muted-foreground">Máximo {max}</span>}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" disabled={out} onClick={() => onAdd(false)}>
                <ShoppingBag /> {out ? "Esgotado" : "Adicionar ao carrinho"}
              </Button>
              {!out && (
                <Button size="lg" variant="cocoa" className="flex-1" onClick={() => onAdd(true)}>
                  Comprar agora
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl bg-secondary p-4 text-sm">
            <Truck className="size-5 shrink-0 text-primary" aria-hidden />
            <p>{contact.delivery}. O custo de entrega é confirmado pela loja no WhatsApp.</p>
          </div>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="Da mesma categoria" title="Também vai gostar" />
          <ProductGrid products={data.related} />
        </section>
      )}
    </div>
  );
}
