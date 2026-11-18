import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import type { PublicProduct } from "@/lib/catalog.types";
import { availabilityLabel, hasValidPromo, isOutOfStock } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "./PriceTag";

export function ProductCard({ product }: { product: PublicProduct }) {
  const image = product.images[0]?.url;
  const out = isOutOfStock(product);
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-blush">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
            <span className="sr-only">Sem fotografia</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasValidPromo(product) && <Badge variant="promo">Promoção</Badge>}
          {out && <Badge variant="muted">Esgotado</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        {product.category && (
          <span className="eyebrow text-[0.62rem] text-gold">{product.category.name}</span>
        )}
        <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug md:text-base">{product.name}</h3>
        <div className="mt-auto pt-2">
          <PriceTag product={product} />
          <span className={out ? "text-xs text-muted-foreground" : "text-xs text-success"}>
            {availabilityLabel(product)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-soft">
          <div className="aspect-[4/5] animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
