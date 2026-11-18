import { createFileRoute, Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { listProducts } from "@/lib/catalog.functions";
import type { CatalogSort } from "@/lib/catalog.types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";

type ShopSearch = { q?: string | undefined; categoria?: string | undefined; ordem?: CatalogSort | undefined; pagina?: number | undefined };

const SORTS: { value: CatalogSort; label: string }[] = [
  { value: "novidades", label: "Novidades" },
  { value: "preco-asc", label: "Preço: menor para maior" },
  { value: "preco-desc", label: "Preço: maior para menor" },
];

export const Route = createFileRoute("/loja")({
  validateSearch: (raw: Record<string, unknown>): ShopSearch => {
    const out: ShopSearch = {};
    if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"].trim().slice(0, 100);
    if (typeof raw["categoria"] === "string" && /^[a-z0-9-]{1,100}$/.test(raw["categoria"])) out.categoria = raw["categoria"];
    if (raw["ordem"] === "novidades" || raw["ordem"] === "preco-asc" || raw["ordem"] === "preco-desc") out.ordem = raw["ordem"];
    const p = Number(raw["pagina"]);
    if (Number.isInteger(p) && p > 1 && p <= 100) out.pagina = p;
    return out;
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listProducts({ data: deps }),
  errorComponent: ShopError,
  head: () => ({
    meta: [
      { title: "Loja — Debby Narciso Cosmetics" },
      { name: "description", content: "Veja todos os cosméticos Debby Narciso disponíveis. Pesquise, filtre por categoria e encomende pelo WhatsApp." },
      { property: "og:title", content: "Loja — Debby Narciso Cosmetics" },
      { property: "og:description", content: "Catálogo de cosméticos com preços em MZN e encomenda pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/loja" });
  const data = Route.useLoaderData();
  const isFetching = useRouterState({ select: (s) => s.status === "pending" });
  const [term, setTerm] = useState(search.q ?? "");

  useEffect(() => setTerm(search.q ?? ""), [search.q]);

  const update = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev) => ({ ...prev, pagina: undefined, ...patch }), resetScroll: false });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q: term.trim() || undefined });
  }

  const activeCategory = data.categories.find((c) => c.slug === search.categoria);

  return (
    <div className="container-shop py-8 md:py-12">
      <header className="mb-6">
        <p className="eyebrow text-gold">Catálogo</p>
        <h1 className="mt-1 text-4xl font-semibold md:text-5xl">{activeCategory ? activeCategory.name : "Loja"}</h1>
        {activeCategory?.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activeCategory.description}</p>}
      </header>

      <div className="sticky top-16 z-20 -mx-5 mb-6 space-y-3 bg-background/95 px-5 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0">
        <div className="flex gap-2">
          <form onSubmit={onSearch} className="flex flex-1" role="search">
            <label htmlFor="shop-search" className="sr-only">Pesquisar por nome</label>
            <div className="flex h-11 flex-1 items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-primary">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <input id="shop-search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Pesquisar por nome" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </form>
          <label htmlFor="shop-sort" className="sr-only">Ordenar</label>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <select
              id="shop-sort"
              value={search.ordem ?? "novidades"}
              onChange={(e) => update({ ordem: e.target.value === "novidades" ? undefined : (e.target.value as CatalogSort) })}
              className="h-11 w-12 appearance-none rounded-full border border-input bg-card pl-9 text-sm text-transparent outline-none focus:border-primary sm:w-auto sm:pr-4 sm:text-foreground"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="text-foreground">{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        {data.categories.length > 0 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filtrar por categoria">
            <CategoryChip active={!search.categoria} onClick={() => update({ categoria: undefined })}>Todas</CategoryChip>
            {data.categories.map((c) => (
              <CategoryChip key={c.id} active={search.categoria === c.slug} onClick={() => update({ categoria: c.slug })}>
                {c.name}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title={search.q || search.categoria ? "Nenhum produto encontrado" : "Ainda não há produtos"}
          description={search.q || search.categoria ? "Experimente outra pesquisa ou categoria." : "Os produtos estarão disponíveis em breve. Fale connosco pelo WhatsApp."}
          action={
            search.q || search.categoria ? (
              <Button asChild variant="outline"><Link to="/loja">Limpar filtros</Link></Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {data.total} produto{data.total === 1 ? "" : "s"}
            {search.q ? ` para “${search.q}”` : ""}
          </p>
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <ProductGrid products={data.items} />
          </div>
          {data.hasMore && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="lg" disabled={isFetching} onClick={() => navigate({ search: (prev) => ({ ...prev, pagina: (prev.pagina ?? 1) + 1 }), resetScroll: false })}>
                {isFetching ? "A carregar…" : "Carregar mais produtos"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-full border px-4 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function ShopError() {
  const router = useRouter();
  return (
    <div className="container-shop py-12">
      <EmptyState title="Não foi possível carregar a loja" description="Verifique a sua ligação e tente novamente." action={<Button onClick={() => router.invalidate()}>Tentar novamente</Button>} />
    </div>
  );
}
