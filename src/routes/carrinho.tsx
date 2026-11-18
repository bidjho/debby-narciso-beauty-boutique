import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageOff, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatMZN, maxOrderable } from "@/lib/pricing";
import { useCartRefresh } from "@/lib/use-cart-refresh";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shop/EmptyState";
import { QuantityStepper } from "@/components/shop/QuantityStepper";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Debby Narciso Cosmetics" },
      { name: "description", content: "Reveja os produtos no seu carrinho antes de enviar a encomenda pelo WhatsApp." },
      { property: "og:title", content: "Carrinho — Debby Narciso Cosmetics" },
      { property: "og:description", content: "Reveja os produtos escolhidos e finalize pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, ready, subtotal, setQuantity, remove } = useCart();
  const { status, retry } = useCartRefresh();

  if (!ready) {
    return <div className="container-shop py-16"><div className="h-40 animate-pulse rounded-3xl bg-muted" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-12">
        <EmptyState
          icon={<ShoppingBag className="size-6" aria-hidden />}
          title="O seu carrinho está vazio"
          description="Explore a loja e adicione os seus produtos favoritos."
          action={<Button asChild><Link to="/loja">Ir para a loja</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-shop py-8 md:py-12">
      <h1 className="text-4xl font-semibold md:text-5xl">Carrinho</h1>
      {status === "error" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-secondary p-4 text-sm">
          <span>Não foi possível confirmar preços e stock atualizados.</span>
          <Button size="sm" variant="outline" onClick={() => retry()}>Tentar novamente</Button>
        </div>
      )}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-border rounded-3xl bg-card px-4 shadow-soft md:px-6">
          {items.map((item) => {
            const max = maxOrderable(item);
            return (
              <li key={item.productId} className="flex gap-4 py-5">
                <Link to="/produto/$slug" params={{ slug: item.slug }} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-blush">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="size-6" aria-hidden /></div>}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link to="/produto/$slug" params={{ slug: item.slug }} className="font-medium leading-snug hover:text-primary">{item.name}</Link>
                    <button type="button" onClick={() => remove(item.productId)} className="-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive" aria-label={`Remover ${item.name}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatMZN(item.unitPrice)} / unidade</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                    <QuantityStepper value={item.quantity} max={max} onChange={(v) => setQuantity(item.productId, v)} label={`Quantidade de ${item.name}`} />
                    <span className="font-semibold">{formatMZN(item.unitPrice * item.quantity)}</span>
                  </div>
                  {max !== null && item.quantity >= max && <p className="mt-1 text-xs text-muted-foreground">Quantidade máxima disponível</p>}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-3xl bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold">Resumo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{formatMZN(subtotal)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Entrega</dt><dd>A confirmar</dd></div>
          </dl>
          <div className="flex justify-between border-t border-border pt-4 text-base">
            <span>Total dos produtos</span><span className="font-semibold">{formatMZN(subtotal)}</span>
          </div>
          <Button asChild size="lg" className="w-full" disabled={status === "checking"}>
            <Link to="/checkout">Finalizar encomenda</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/loja">Continuar a comprar</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
