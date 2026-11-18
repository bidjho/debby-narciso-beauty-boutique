import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCw, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery, type AdminProduct } from "@/lib/admin-queries";
import { dbErrorMessage, removeImages, uploadImage, validateImageFile } from "@/lib/admin-images";
import { storageImageUrl } from "@/lib/images";
import { productFormSchema, type ProductFormInput } from "@/lib/product-form-schema";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ImageSlot = {
  key: string;
  id?: string;
  storagePath?: string | null;
  previewUrl: string;
  file?: File;
};

function initialValues(p?: AdminProduct | null): ProductFormInput {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    promoPrice: p?.promo_price != null ? String(p.promo_price) : "",
    promoActive: p?.promo_active ?? false,
    categoryId: p?.category_id ?? "",
    manageStock: p?.manage_stock ?? false,
    stock: p?.stock != null ? String(p.stock) : "",
    isActive: p?.is_active ?? true,
    isFeatured: p?.is_featured ?? false,
    sortOrder: String(p?.sort_order ?? 0),
  };
}

function initialImages(p?: AdminProduct | null): ImageSlot[] {
  if (!p) return [];
  return [...p.product_images]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => ({ key: i.id, id: i.id, storagePath: i.storage_path, previewUrl: storageImageUrl(i.storage_path) ?? i.image_url ?? "" }));
}

export function ProductForm({ product }: { product?: AdminProduct | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categories = useQuery(adminCategoriesQuery);
  const [values, setValues] = useState<ProductFormInput>(() => initialValues(product));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [images, setImages] = useState<ImageSlot[]>(() => initialImages(product));
  const [removed, setRemoved] = useState<ImageSlot[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceKey, setReplaceKey] = useState<string | null>(null);

  useEffect(() => () => images.forEach((i) => i.file && URL.revokeObjectURL(i.previewUrl)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof ProductFormInput>(k: K, v: ProductFormInput[K]) => {
    setValues((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "name" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  function addFiles(files: FileList | null) {
    if (!files) return;
    const slots: ImageSlot[] = [];
    for (const f of Array.from(files)) {
      const err = validateImageFile(f);
      if (err) {
        toast.error(`${f.name}: ${err}`);
        continue;
      }
      slots.push({ key: crypto.randomUUID(), file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (images.length + slots.length > 10) {
      toast.error("Máximo de 10 fotografias por produto.");
      slots.splice(10 - images.length);
    }
    setImages((prev) => [...prev, ...slots]);
  }

  function replaceFile(files: FileList | null) {
    const f = files?.[0];
    if (!f || !replaceKey) return;
    const err = validateImageFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    setImages((prev) =>
      prev.map((s) => {
        if (s.key !== replaceKey) return s;
        if (s.id) setRemoved((r) => [...r, s]);
        return { key: crypto.randomUUID(), file: f, previewUrl: URL.createObjectURL(f) };
      }),
    );
    setReplaceKey(null);
  }

  function removeSlot(slot: ImageSlot) {
    setImages((prev) => prev.filter((s) => s.key !== slot.key));
    if (slot.id) setRemoved((r) => [...r, slot]);
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (item) next.splice(j, 0, item);
      return next;
    });
  }

  function makePrimary(index: number) {
    setImages((prev) => {
      const item = prev[index];
      return item ? [item, ...prev.filter((_, i) => i !== index)] : prev;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = productFormSchema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]);
        if (!errs[k]) errs[k] = i.message;
      }
      setErrors(errs);
      toast.error("Verifique os campos assinalados.");
      return;
    }
    setSaving(true);
    try {
      const payload = parsed.data;
      let productId = product?.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Upload new files
      const uploaded: { slot: ImageSlot; path: string }[] = [];
      for (const slot of images) {
        if (slot.file) uploaded.push({ slot, path: await uploadImage(slot.file, `products/${productId}`) });
      }

      // Delete removed image rows + files
      if (removed.length) {
        const ids = removed.map((r) => r.id!).filter(Boolean);
        const { error } = await supabase.from("product_images").delete().in("id", ids);
        if (error) throw error;
        await removeImages(removed.map((r) => r.storagePath));
      }

      // Clear primary flag first (unique index), then upsert order
      const existingIds = images.filter((s) => s.id).map((s) => s.id!);
      if (existingIds.length) {
        const { error } = await supabase.from("product_images").update({ is_primary: false }).in("id", existingIds);
        if (error) throw error;
      }
      for (const [index, slot] of images.entries()) {
        const row = { is_primary: index === 0, sort_order: index };
        if (slot.id) {
          const { error } = await supabase.from("product_images").update(row).eq("id", slot.id);
          if (error) throw error;
        } else {
          const path = uploaded.find((u) => u.slot.key === slot.key)!.path;
          const { error } = await supabase.from("product_images").insert({ ...row, product_id: productId!, storage_path: path });
          if (error) throw error;
        }
      }

      await qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(product ? "Produto atualizado" : "Produto criado");
      navigate({ to: "/admin/produtos" });
    } catch (err) {
      const e2 = err as { code?: string; message?: string };
      if (e2.code === "23505") setErrors((x) => ({ ...x, slug: "Já existe um produto com este slug" }));
      toast.error(dbErrorMessage(e2, "Não foi possível guardar o produto."));
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k] ? <p className="text-xs text-destructive" role="alert">{errors[k]}</p> : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft md:p-6">
        <h2 className="text-xl font-semibold">Informação</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors["name"]} maxLength={160} />
          {err("name")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (endereço) *</Label>
          <Input id="slug" value={values.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} aria-invalid={!!errors["slug"]} maxLength={80} />
          {errors["slug"] ? err("slug") : <p className="text-xs text-muted-foreground">/produto/{values.slug || "…"}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={5} value={values.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} />
          {err("description")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoria</Label>
          <select id="category" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary">
            <option value="">Sem categoria</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (inativa)"}</option>)}
          </select>
          {categories.data?.length === 0 && <p className="text-xs text-muted-foreground">Ainda não há categorias. <Link to="/admin/categorias" className="text-primary underline">Criar categoria</Link></p>}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft md:p-6">
        <h2 className="text-xl font-semibold">Preço e promoção</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (MZN) *</Label>
            <Input id="price" inputMode="decimal" value={values.price} onChange={(e) => set("price", e.target.value)} aria-invalid={!!errors["price"]} placeholder="0,00" />
            {err("price")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promoPrice">Preço promocional (MZN)</Label>
            <Input id="promoPrice" inputMode="decimal" value={values.promoPrice} onChange={(e) => set("promoPrice", e.target.value)} aria-invalid={!!errors["promoPrice"]} placeholder="Opcional" />
            {err("promoPrice")}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <span><span className="font-medium">Promoção ativa</span><span className="block text-xs text-muted-foreground">Mostra o preço promocional e o preço anterior riscado na loja.</span></span>
          <Switch checked={values.promoActive} onCheckedChange={(v) => set("promoActive", v)} />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft md:p-6">
        <h2 className="text-xl font-semibold">Stock</h2>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <span><span className="font-medium">Controlar stock</span><span className="block text-xs text-muted-foreground">Os clientes não podem encomendar mais do que o stock disponível.</span></span>
          <Switch checked={values.manageStock} onCheckedChange={(v) => set("manageStock", v)} />
        </label>
        {values.manageStock && (
          <div className="space-y-1.5">
            <Label htmlFor="stock">Quantidade em stock *</Label>
            <Input id="stock" type="number" min={0} step={1} inputMode="numeric" value={values.stock} onChange={(e) => set("stock", e.target.value)} aria-invalid={!!errors["stock"]} />
            {err("stock")}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 shadow-soft md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fotografias</h2>
          <span className="text-xs text-muted-foreground">{images.length}/10 · a primeira é a principal</span>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => { replaceFile(e.target.files); e.target.value = ""; }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.key} className={cn("overflow-hidden rounded-xl border-2 bg-blush", i === 0 ? "border-primary" : "border-transparent")}>
              <div className="relative aspect-square">
                <img src={img.previewUrl} alt={`Fotografia ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">Principal</span>}
                {img.file && <span className="absolute right-2 top-2 rounded-full bg-card px-2 py-0.5 text-[0.65rem]">Nova</span>}
              </div>
              <div className="flex justify-between bg-card p-1">
                <IconBtn label="Tornar principal" onClick={() => makePrimary(i)} disabled={i === 0}><Star /></IconBtn>
                <IconBtn label="Mover para a esquerda" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="-rotate-90" /></IconBtn>
                <IconBtn label="Mover para a direita" onClick={() => move(i, 1)} disabled={i === images.length - 1}><ArrowDown className="-rotate-90" /></IconBtn>
                <IconBtn label="Substituir fotografia" onClick={() => { setReplaceKey(img.key); replaceRef.current?.click(); }}><RefreshCw /></IconBtn>
                <IconBtn label="Remover fotografia" onClick={() => removeSlot(img)} danger><Trash2 /></IconBtn>
              </div>
            </div>
          ))}
          {images.length < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-6" aria-hidden /> Adicionar fotografias
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-5 shadow-soft md:p-6">
        <h2 className="text-xl font-semibold">Visibilidade</h2>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <span><span className="font-medium">Ativo</span><span className="block text-xs text-muted-foreground">Produtos inativos não aparecem na loja.</span></span>
          <Switch checked={values.isActive} onCheckedChange={(v) => set("isActive", v)} />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <span><span className="font-medium">Destaque na página inicial</span></span>
          <Switch checked={values.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Ordem de apresentação</Label>
          <Input id="sortOrder" type="number" step={1} inputMode="numeric" value={values.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="max-w-32" />
          {errors["sortOrder"] ? err("sortOrder") : <p className="text-xs text-muted-foreground">Números menores aparecem primeiro.</p>}
        </div>
        {product && <p className="text-xs text-muted-foreground">Criado em {new Date(product.created_at).toLocaleDateString("pt-PT")}</p>}
      </section>

      <div className="sticky bottom-16 z-20 flex gap-3 rounded-2xl bg-card/95 p-3 shadow-soft backdrop-blur md:bottom-4">
        <Button type="button" variant="outline" className="flex-1" asChild><Link to="/admin/produtos">Cancelar</Link></Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> A guardar…</> : product ? "Guardar alterações" : "Criar produto"}</Button>
      </div>
    </form>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn("flex size-8 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30 [&_svg]:size-3.5", danger && "text-destructive")}>
      {children}
    </button>
  );
}
