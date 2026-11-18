import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery, type CategoryRow } from "@/lib/admin-queries";
import { dbErrorMessage, removeImages, uploadImage, validateImageFile } from "@/lib/admin-images";
import { storageImageUrl } from "@/lib/images";
import { slugify, SLUG_PATTERN } from "@/lib/slug";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: AdminCategories,
});

type Cat = CategoryRow & { productCount: number };

const schema = z.object({
  name: z.string().trim().min(1, "Indique o nome").max(120, "Máximo 120 caracteres"),
  slug: z.string().trim().regex(SLUG_PATTERN, "Use letras minúsculas, números e hífens").max(80),
  description: z.string().trim().max(1000, "Máximo 1000 caracteres"),
  is_active: z.boolean(),
  sort_order: z.number().int("Número inteiro"),
});

function AdminCategories() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery(adminCategoriesQuery);
  const [editing, setEditing] = useState<Cat | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    if (toDelete.productCount > 0) {
      toast.error(`“${toDelete.name}” tem ${toDelete.productCount} produto(s). Mova-os para outra categoria ou elimine-os primeiro.`);
      setToDelete(null);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("categories").delete().eq("id", toDelete.id);
    if (error) toast.error(dbErrorMessage(error));
    else {
      await removeImages([toDelete.image_path]);
      toast.success("Categoria eliminada");
      qc.invalidateQueries({ queryKey: ["admin"] });
    }
    setBusy(false);
    setToDelete(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize os produtos da loja.</p>
        </div>
        <Button onClick={() => setEditing("new")}><Plus /> Nova categoria</Button>
      </div>

      {isError ? (
        <p className="mt-6 rounded-2xl bg-card p-6 text-sm text-destructive">Não foi possível carregar as categorias.</p>
      ) : isLoading ? (
        <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />)}</div>
      ) : data!.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Ainda não há categorias. Crie a primeira, por exemplo “Lábios” ou “Olhos”.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data!.map((c) => {
            const src = storageImageUrl(c.image_path) ?? c.image_url;
            return (
              <li key={c.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-gradient-blush">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="font-sans text-base font-medium">{c.name}</h2>
                    {!c.is_active && <Badge variant="muted">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">/{c.slug} · {c.productCount} produto{c.productCount === 1 ? "" : "s"} · Ordem {c.sort_order}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}><Pencil /><span className="hidden sm:inline">Editar</span></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(c)} aria-label={`Eliminar ${c.name}`}><Trash2 /></Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing === "new" ? "Nova categoria" : "Editar categoria"}</DialogTitle></DialogHeader>
          {editing !== null && (
            <CategoryForm
              key={editing === "new" ? "new" : editing.id}
              category={editing === "new" ? null : editing}
              onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin"] }); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !busy && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && toDelete.productCount > 0
                ? `“${toDelete.name}” tem ${toDelete.productCount} produto(s) associado(s). Mova-os para outra categoria ou elimine-os antes de eliminar a categoria.`
                : `“${toDelete?.name}” será eliminada definitivamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{toDelete && toDelete.productCount > 0 ? "Fechar" : "Cancelar"}</AlertDialogCancel>
            {toDelete && toDelete.productCount === 0 && (
              <AlertDialogAction onClick={(e) => { e.preventDefault(); void confirmDelete(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {busy ? "A eliminar…" : "Eliminar"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: Cat | null; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(storageImageUrl(category?.image_path) ?? category?.image_url ?? null);
  const [clearImage, setClearImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, slug, description, is_active: isActive, sort_order: Number(sortOrder || 0) });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      let image_path = category?.image_path ?? null;
      const oldPath = image_path;
      if (file) image_path = await uploadImage(file, "categories");
      else if (clearImage) image_path = null;
      const payload = { ...parsed.data, description: parsed.data.description || null, image_path, image_url: image_path ? null : category?.image_url ?? null };
      if (clearImage && !file) payload.image_url = null;
      const { error } = category
        ? await supabase.from("categories").update(payload).eq("id", category.id)
        : await supabase.from("categories").insert(payload);
      if (error) {
        if (file && image_path) await removeImages([image_path]);
        throw error;
      }
      if (oldPath && oldPath !== image_path) await removeImages([oldPath]);
      toast.success(category ? "Categoria atualizada" : "Categoria criada");
      onDone();
    } catch (err) {
      const e2 = err as { code?: string; message?: string };
      if (e2.code === "23505") setErrors((x) => ({ ...x, slug: "Já existe uma categoria com este slug" }));
      toast.error(dbErrorMessage(e2, "Não foi possível guardar a categoria."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Nome *</Label>
        <Input id="cat-name" value={name} maxLength={120} aria-invalid={!!errors["name"]} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
        {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-slug">Slug *</Label>
        <Input id="cat-slug" value={slug} maxLength={80} aria-invalid={!!errors["slug"]} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} />
        {errors["slug"] && <p className="text-xs text-destructive">{errors["slug"]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-desc">Descrição</Label>
        <Textarea id="cat-desc" rows={3} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Imagem (opcional)</Label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const v = validateImageFile(f);
          if (v) {
            toast.error(v);
            return;
          }
          setFile(f); setPreview(URL.createObjectURL(f)); setClearImage(false);
        }} />
        {preview ? (
          <div className="relative size-28 overflow-hidden rounded-xl">
            <img src={preview} alt="Imagem da categoria" className="h-full w-full object-cover" />
            <button type="button" onClick={() => { setFile(null); setPreview(null); setClearImage(true); }} className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-card shadow" aria-label="Remover imagem"><X className="size-4" /></button>
          </div>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus /> {preview ? "Substituir imagem" : "Escolher imagem"}</Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-order">Ordem</Label>
          <Input id="cat-order" type="number" step={1} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-24" />
          {errors["sort_order"] && <p className="text-xs text-destructive">{errors["sort_order"]}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={isActive} onCheckedChange={setIsActive} /> Ativa</label>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> A guardar…</> : "Guardar"}</Button>
    </form>
  );
}
