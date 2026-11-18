import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, type AdminProduct } from "@/lib/admin-queries";
import { dbErrorMessage, removeImages } from "@/lib/admin-images";
import { storageImageUrl } from "@/lib/images";
import { formatMZN, hasValidPromo, isOutOfStock } from "@/lib/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Filtro = "todos" | "ativos" | "inativos" | "promocao" | "sem-stock" | "destaque";
const FILTERS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
  { value: "promocao", label: "Em promoção" },
  { value: "destaque", label: "Destaque" },
  { value: "sem-stock", label: "Sem stock" },
];

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  validateSearch: (raw: Record<string, unknown>): { filtro?: Filtro | undefined } =>
    FILTERS.some((f) => f.value === raw["filtro"]) ? { filtro: raw["filtro"] as Filtro } : {},
  component: AdminProducts,
});

const info = (p: AdminProduct) => ({
  price: Number(p.price),
  promoPrice: p.promo_price == null ? null : Number(p.promo_price),
  promoActive: p.promo_active,
  manageStock: p.manage_stock,
  stock: p.stock,
});

function AdminProducts() {
  const { filtro = "todos" } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/produtos/" });
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(adminProductsQuery);
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    let l = data ?? [];
    const needle = q.trim().toLowerCase();
    if (needle) l = l.filter((p) => p.name.toLowerCase().includes(needle));
    if (filtro === "ativos") l = l.filter((p) => p.is_active);
    if (filtro === "inativos") l = l.filter((p) => !p.is_active);
    if (filtro === "promocao") l = l.filter((p) => hasValidPromo(info(p)));
    if (filtro === "destaque") l = l.filter((p) => p.is_featured);
    if (filtro === "sem-stock") l = l.filter((p) => isOutOfStock(info(p)));
    return l;
  }, [data, q, filtro]);

  async function toggle(p: AdminProduct, field: "is_active" | "promo_active" | "is_featured", value: boolean) {
    if (field === "promo_active" && value && !(p.promo_price != null && Number(p.promo_price) < Number(p.price))) {
      toast.error("Defina primeiro um preço promocional menor que o preço normal (editar produto).");
      return;
    }
    const patch = field === "is_active" ? { is_active: value } : field === "promo_active" ? { promo_active: value } : { is_featured: value };
    const { error } = await supabase.from("products").update(patch).eq("id", p.id);
    if (error) toast.error(dbErrorMessage(error));
    else {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["admin"] });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const paths = toDelete.product_images.map((i) => i.storage_path);
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    if (error) {
      toast.error(dbErrorMessage(error));
    } else {
      await removeImages(paths);
      toast.success(`“${toDelete.name}” eliminado`);
      qc.invalidateQueries({ queryKey: ["admin"] });
    }
    setBusy(false);
    setToDelete(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data ? `${data.length} no total` : "A carregar…"}</p>
        </div>
        <Button asChild><Link to="/admin/produtos/novo"><Plus /> Adicionar produto</Link></Button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex h-11 items-center gap-2 rounded-full border border-input bg-card px-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="admin-q" className="sr-only">Pesquisar produtos</label>
          <input id="admin-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" aria-pressed={filtro === f.value} onClick={() => navigate({ search: f.value === "todos" ? {} : { filtro: f.value } })} className={cn("h-9 shrink-0 rounded-full border px-4 text-sm", filtro === f.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="mt-6 rounded-2xl bg-card p-6 text-sm">Não foi possível carregar os produtos. <Button variant="link" onClick={() => refetch()}>Tentar novamente</Button></div>
      ) : isLoading ? (
        <div className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}</div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {data && data.length > 0 ? "Nenhum produto corresponde ao filtro." : "Ainda não há produtos. Adicione o primeiro."}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((p) => {
            const img = [...p.product_images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
            const src = img ? storageImageUrl(img.storage_path) ?? img.image_url : null;
            const i = info(p);
            return (
              <li key={p.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex gap-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-blush">
                    {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="size-5" aria-hidden /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="truncate font-sans text-base font-medium">{p.name}</h2>
                      {!p.is_active && <Badge variant="muted">Inativo</Badge>}
                      {hasValidPromo(i) && <Badge variant="promo">Promoção</Badge>}
                      {p.is_featured && <Badge variant="gold">Destaque</Badge>}
                      {isOutOfStock(i) && <Badge variant="destructive">Sem stock</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.categories?.name ?? "Sem categoria"} · Ordem {p.sort_order}{p.manage_stock ? ` · Stock ${p.stock ?? 0}` : ""}</p>
                    <p className="mt-1 text-sm">
                      {hasValidPromo(i) ? (<><span className="font-semibold text-primary">{formatMZN(i.promoPrice!)}</span> <span className="text-xs text-muted-foreground line-through">{formatMZN(i.price)}</span></>) : <span className="font-semibold">{formatMZN(i.price)}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="flex items-center gap-2"><Switch checked={p.is_active} onCheckedChange={(v) => toggle(p, "is_active", v)} aria-label="Ativo" /> Ativo</label>
                    <label className="flex items-center gap-2"><Switch checked={p.promo_active} onCheckedChange={(v) => toggle(p, "promo_active", v)} aria-label="Promoção" /> Promoção</label>
                    <label className="flex items-center gap-2"><Switch checked={p.is_featured} onCheckedChange={(v) => toggle(p, "is_featured", v)} aria-label="Destaque" /> Destaque</label>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline"><Link to="/admin/produtos/$id" params={{ id: p.id }}><Pencil /> Editar</Link></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(p)} aria-label={`Eliminar ${p.name}`}><Trash2 /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !busy && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar produto?</AlertDialogTitle>
            <AlertDialogDescription>“{toDelete?.name}” e as suas fotografias serão eliminados definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void confirmDelete(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? "A eliminar…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
