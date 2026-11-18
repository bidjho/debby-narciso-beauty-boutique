export type PriceInfo = {
  price: number;
  promoPrice: number | null;
  promoActive: boolean;
};

export type StockInfo = {
  manageStock: boolean;
  stock: number | null;
};

/** A promotion is valid only when active, set, positive and lower than the normal price. */
export function hasValidPromo(p: PriceInfo): boolean {
  return (
    p.promoActive &&
    p.promoPrice != null &&
    Number.isFinite(p.promoPrice) &&
    p.promoPrice > 0 &&
    p.promoPrice < p.price
  );
}

export function effectivePrice(p: PriceInfo): number {
  return hasValidPromo(p) ? (p.promoPrice as number) : p.price;
}

/** Maximum quantity a customer can order, or null when there is no stock limit. */
export function maxOrderable(s: StockInfo): number | null {
  if (!s.manageStock) return null;
  return Math.max(0, s.stock ?? 0);
}

export function isOutOfStock(s: StockInfo): boolean {
  const max = maxOrderable(s);
  return max !== null && max <= 0;
}

/** Clamp a requested quantity to [1, stock]. Returns 0 when nothing can be ordered. */
export function clampQuantity(requested: number, s: StockInfo): number {
  const max = maxOrderable(s);
  const q = Number.isFinite(requested) ? Math.floor(requested) : 1;
  if (max !== null && max <= 0) return 0;
  const lower = Math.max(1, q);
  const capped = Math.min(lower, 999);
  return max === null ? capped : Math.min(capped, max);
}

/** Format an amount in Mozambican meticais, e.g. "1 250,00 MZN". */
export function formatMZN(amount: number): string {
  const fixed = (Math.round(amount * 100) / 100).toFixed(2);
  const [int = "0", dec = "00"] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${grouped},${dec}\u00A0MZN`;
}

export function availabilityLabel(s: StockInfo): string {
  const max = maxOrderable(s);
  if (max === null) return "Disponível";
  if (max <= 0) return "Esgotado";
  if (max <= 3) return `Últimas ${max} unidade${max === 1 ? "" : "s"}`;
  return "Disponível";
}
