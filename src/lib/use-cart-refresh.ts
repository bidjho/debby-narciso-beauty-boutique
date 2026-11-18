import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getProductsByIds } from "./catalog.functions";
import { useCart } from "./cart";

/** Re-validates cart items against the live catalogue (price, stock, active). */
export function useCartRefresh() {
  const { items, ready, sync } = useCart();
  const fetchProducts = useServerFn(getProductsByIds);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const done = useRef(false);

  async function run() {
    setStatus("checking");
    try {
      const fresh = await fetchProducts({ data: { ids: items.map((i) => i.productId) } });
      const { removed, adjusted } = sync(fresh);
      if (removed.length) toast.warning(`Removido do carrinho por já não estar disponível: ${removed.join(", ")}`);
      if (adjusted.length) toast.info(`Preço ou quantidade atualizados: ${adjusted.join(", ")}`);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    if (items.length === 0) {
      setStatus("ok");
      return;
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { status, retry: run };
}
