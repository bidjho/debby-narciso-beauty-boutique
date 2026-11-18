import { effectivePrice, formatMZN, hasValidPromo, type PriceInfo } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PriceTag({ product, size = "md", className }: { product: PriceInfo; size?: "md" | "lg"; className?: string }) {
  const promo = hasValidPromo(product);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold", promo ? "text-primary" : "text-foreground", size === "lg" ? "text-2xl" : "text-base")}>
        {formatMZN(effectivePrice(product))}
      </span>
      {promo && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
          <span className="sr-only">Preço anterior: </span>
          {formatMZN(product.price)}
        </span>
      )}
    </div>
  );
}
