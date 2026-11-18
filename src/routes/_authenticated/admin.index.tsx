import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderTree, Package, Plus, Tag } from "lucide-react";
import { adminCategoriesQuery, adminProductsQuery } from "@/lib/admin-queries";
import { hasValidPromo, isOutOfStock } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const products = useQuery(adminProductsQuery);
  const categories = useQuery(adminCategoriesQuery);
  const list = products.data ?? [];
  const toInfo = (p: (typeof list)[number]) => ({
    price: Number(p.price),
    promoPrice: p.promo_price == null ? null : Number(p.promo_price),
    promoActive: p.promo_active,
    manageStock: p.manage_stock,
    stock: p.stock,
  });
  const stats = [
    { label: "Produtos ativos", value: list.filter((p) => p.is_active).length, icon: Package },
    { label: "Categorias", value: categories.data?.length ?? 0, icon: FolderTree },
    { label: "Sem stock", value: list.filter((p) => isOutOfStock(toInfo(p))).length, icon: AlertTriangle },
    { label: "Em promoção", value: list.filter((p) => hasValidPromo(toInfo(p))).length, icon: Tag },
  ];
  const loading = products.isLoading || categories.isLoading;
  const failed = products.isError || categories.isError;

  return (
    <div>
      <h1 className="text-4xl font-semibold">Resumo</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da loja.</p>

      {failed && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar os dados. Atualize a página.</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 shadow-soft">
            <s.icon className="size-5 text-primary" aria-hidden />
            <p className="mt-3 text-3xl font-semibold tabular-nums">{loading ? "–" : s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Atalhos</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button asChild size="lg"><Link to="/admin/produtos/novo"><Plus /> Adicionar produto</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/admin/categorias"><FolderTree /> Gerir categorias</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/admin/produtos" search={{ filtro: "promocao" }}><Tag /> Ver promoções</Link></Button>
      </div>

      {!loading && list.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-6 text-sm">
          <p className="font-medium">Ainda não há produtos.</p>
          <p className="mt-1 text-muted-foreground">Comece por criar as categorias e depois adicione os produtos com fotografias e preços.</p>
        </div>
      )}
    </div>
  );
}
