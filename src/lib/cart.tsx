import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clampQuantity, effectivePrice, maxOrderable } from "./pricing";
import type { PublicProduct } from "./catalog.types";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  manageStock: boolean;
  stock: number | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (product: PublicProduct, quantity: number) => { added: number; capped: boolean };
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Replace cart data with fresh product data; returns names of removed / adjusted items. */
  sync: (fresh: PublicProduct[]) => { removed: string[]; adjusted: string[] };
};

const STORAGE_KEY = "dn-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function toItem(p: PublicProduct, quantity: number): CartItem {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    unitPrice: effectivePrice(p),
    imageUrl: p.images[0]?.url ?? null,
    quantity,
    manageStock: p.manageStock,
    stock: p.stock,
  };
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.productId === "string" &&
        typeof i.name === "string" &&
        typeof i.unitPrice === "number" &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    (product, quantity) => {
      const prev = itemsRef.current;
      const existing = prev.find((i) => i.productId === product.id);
      const current = existing?.quantity ?? 0;
      const wanted = current + quantity;
      const allowed = clampQuantity(wanted, product);
      if (allowed <= 0) {
        commit(prev.filter((i) => i.productId !== product.id));
        return { added: 0, capped: true };
      }
      const next = toItem(product, allowed);
      commit(existing ? prev.map((i) => (i.productId === product.id ? next : i)) : [...prev, next]);
      return { added: Math.max(0, allowed - current), capped: allowed < wanted };
    },
    [commit],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      commit(
        itemsRef.current.flatMap((i) => {
          if (i.productId !== productId) return [i];
          const q = clampQuantity(quantity, i);
          return q <= 0 ? [] : [{ ...i, quantity: q }];
        }),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (productId: string) => commit(itemsRef.current.filter((i) => i.productId !== productId)),
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const sync = useCallback<CartContextValue["sync"]>(
    (fresh) => {
      const removed: string[] = [];
      const adjusted: string[] = [];
      const next = itemsRef.current.flatMap((i) => {
        const p = fresh.find((f) => f.id === i.productId);
        if (!p) {
          removed.push(i.name);
          return [];
        }
        const max = maxOrderable(p);
        if (max !== null && max <= 0) {
          removed.push(i.name);
          return [];
        }
        const q = clampQuantity(i.quantity, p);
        const item = toItem(p, q);
        if (q !== i.quantity || item.unitPrice !== i.unitPrice) adjusted.push(p.name);
        return [item];
      });
      commit(next);
      return { removed, adjusted };
    },
    [commit],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [items, ready, add, setQuantity, remove, clear, sync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
