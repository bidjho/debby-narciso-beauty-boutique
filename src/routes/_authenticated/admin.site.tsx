import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImagePlus, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { removeImages, uploadImage, validateImageFile } from "@/lib/admin-images";
import { storageImageUrl } from "@/lib/images";
import {
  formatStorePhone,
  mergeSiteContent,
  siteContentSchema,
  sitePhotoPaths,
  type SiteContent,
} from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import heroImg from "@/assets/gloss-colecao.webp.asset.json";
import modelsImg from "@/assets/tres-modelos.webp.asset.json";
import storeImg from "@/assets/loja-debby-narciso.webp.asset.json";
import lipstickImg from "@/assets/modelo-batom.webp.asset.json";

export const Route = createFileRoute("/_authenticated/admin/site")({
  component: AdminSite,
});

const siteQuery = {
  queryKey: ["admin", "site-content"],
  queryFn: async (): Promise<SiteContent> => {
    const { data, error } = await supabase.from("site_content").select("content").eq("id", "main").maybeSingle();
    if (error) throw error;
    return mergeSiteContent(data?.content);
  },
};

type Errors = Record<string, string>;

function toForm(c: SiteContent): SiteContent {
  return {
    ...c,
    contact: { ...c.contact, whatsappNumber: formatStorePhone(c.contact.whatsappNumber), altPhone: formatStorePhone(c.contact.altPhone) },
  };
}

function AdminSite() {
  const { data, isLoading, isError } = useQuery(siteQuery);

  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  if (isError || !data) return <p className="text-sm text-destructive">Não foi possível carregar o conteúdo do site. Atualize a página.</p>;
  return <SiteEditor saved={data} />;
}

function SiteEditor({ saved }: { saved: SiteContent }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContent>(() => toForm(saved));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const uploaded = useRef<string[]>([]);

  const update = (fn: (d: SiteContent) => SiteContent) => setDraft((d) => fn(structuredClone(d)));
  const err = (path: string) => errors[path];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = siteContentSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Verifique os campos assinalados");
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`site-${first}`)?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: rows, error } = await supabase
      .from("site_content")
      .update({ content: parsed.data, updated_at: new Date().toISOString(), updated_by: auth.user?.id ?? null })
      .eq("id", "main")
      .select("id");
    setSaving(false);
    if (error || !rows?.length) {
      toast.error(error?.code === "42501" || !rows?.length ? "Sem permissão para alterar o site." : "Não foi possível guardar. Tente novamente.");
      return;
    }
    // Clean up photos that were replaced or uploaded and then discarded.
    const inUse = new Set(sitePhotoPaths(parsed.data));
    const stale = [...sitePhotoPaths(saved), ...uploaded.current].filter((p) => !inUse.has(p));
    uploaded.current = [];
    if (stale.length) await removeImages(stale).catch(() => undefined);
    qc.setQueryData(siteQuery.queryKey, parsed.data);
    setDraft(toForm(parsed.data));
    await router.invalidate();
    toast.success("Site atualizado");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-gold">Site</p>
          <h1 className="mt-1 text-3xl font-semibold">Editar o site</h1>
          <p className="mt-1 text-sm text-muted-foreground">Textos, fotografias, contactos e horário que os clientes veem.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink /> Ver site</a>
        </Button>
      </div>

      <Section title="Início — destaque principal" description="A primeira coisa que os clientes veem na página inicial.">
        <Field id="hero.eyebrow" label="Texto pequeno por cima do título" error={err("hero.eyebrow")}>
          <Input id="site-hero.eyebrow" value={draft.hero.eyebrow} maxLength={60} onChange={(e) => update((d) => ((d.hero.eyebrow = e.target.value), d))} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="hero.titleLine1" label="Título" error={err("hero.titleLine1")}>
            <Input id="site-hero.titleLine1" value={draft.hero.titleLine1} maxLength={60} onChange={(e) => update((d) => ((d.hero.titleLine1 = e.target.value), d))} />
          </Field>
          <Field id="hero.titleHighlight" label="Título em destaque (cor)" hint="Opcional" error={err("hero.titleHighlight")}>
            <Input id="site-hero.titleHighlight" value={draft.hero.titleHighlight} maxLength={60} onChange={(e) => update((d) => ((d.hero.titleHighlight = e.target.value), d))} />
          </Field>
        </div>
        <Field id="hero.subtitle" label="Descrição" error={err("hero.subtitle")}>
          <Textarea id="site-hero.subtitle" rows={3} value={draft.hero.subtitle} maxLength={300} onChange={(e) => update((d) => ((d.hero.subtitle = e.target.value), d))} />
        </Field>
        <Field id="hero.badge" label="Etiqueta sobre a fotografia" hint="Opcional. Deixe vazio para esconder." error={err("hero.badge")}>
          <Input id="site-hero.badge" value={draft.hero.badge} maxLength={60} onChange={(e) => update((d) => ((d.hero.badge = e.target.value), d))} />
        </Field>
        <PhotoField label="Fotografia principal" path={draft.hero.imagePath} fallback={heroImg.url} onUploaded={(p) => uploaded.current.push(p)} onChange={(p) => update((d) => ((d.hero.imagePath = p), d))} />
      </Section>

      <Section title="Vantagens" description="Os três quadros com ícone na página inicial.">
        <div className="grid gap-4 md:grid-cols-3">
          {draft.benefits.map((b, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
              <Field id={`benefits.${i}.title`} label={`Título ${i + 1}`} error={err(`benefits.${i}.title`)}>
                <Input id={`site-benefits.${i}.title`} value={b.title} maxLength={60} onChange={(e) => update((d) => ((d.benefits[i]!.title = e.target.value), d))} />
              </Field>
              <Field id={`benefits.${i}.text`} label="Texto" error={err(`benefits.${i}.text`)}>
                <Textarea id={`site-benefits.${i}.text`} rows={3} value={b.text} maxLength={200} onChange={(e) => update((d) => ((d.benefits[i]!.text = e.target.value), d))} />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Faixa da marca" description="A frase e as duas fotografias de modelos na página inicial.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="editorial.eyebrow" label="Texto pequeno" hint="Opcional" error={err("editorial.eyebrow")}>
            <Input id="site-editorial.eyebrow" value={draft.editorial.eyebrow} maxLength={60} onChange={(e) => update((d) => ((d.editorial.eyebrow = e.target.value), d))} />
          </Field>
          <Field id="editorial.text" label="Frase" error={err("editorial.text")}>
            <Input id="site-editorial.text" value={draft.editorial.text} maxLength={160} onChange={(e) => update((d) => ((d.editorial.text = e.target.value), d))} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoField label="Fotografia vertical" path={draft.editorial.image1Path} fallback={modelsImg.url} onUploaded={(p) => uploaded.current.push(p)} onChange={(p) => update((d) => ((d.editorial.image1Path = p), d))} />
          <PhotoField label="Fotografia horizontal" path={draft.editorial.image2Path} fallback={lipstickImg.url} onUploaded={(p) => uploaded.current.push(p)} onChange={(p) => update((d) => ((d.editorial.image2Path = p), d))} />
        </div>
      </Section>

      <Section title="Contactos e horário" description="Aparecem no cabeçalho, no rodapé, na página inicial e no checkout.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact.whatsappNumber" label="WhatsApp das encomendas" hint="As encomendas do checkout são enviadas para este número." error={err("contact.whatsappNumber")}>
            <Input id="site-contact.whatsappNumber" type="tel" inputMode="tel" value={draft.contact.whatsappNumber} maxLength={20} onChange={(e) => update((d) => ((d.contact.whatsappNumber = e.target.value), d))} />
          </Field>
          <Field id="contact.altPhone" label="Telefone" error={err("contact.altPhone")}>
            <Input id="site-contact.altPhone" type="tel" inputMode="tel" value={draft.contact.altPhone} maxLength={20} onChange={(e) => update((d) => ((d.contact.altPhone = e.target.value), d))} />
          </Field>
          <Field id="contact.address" label="Morada" error={err("contact.address")}>
            <Input id="site-contact.address" value={draft.contact.address} maxLength={120} onChange={(e) => update((d) => ((d.contact.address = e.target.value), d))} />
          </Field>
          <Field id="contact.city" label="Cidade" error={err("contact.city")}>
            <Input id="site-contact.city" value={draft.contact.city} maxLength={80} onChange={(e) => update((d) => ((d.contact.city = e.target.value), d))} />
          </Field>
          <Field id="contact.instagram" label="Instagram" hint="Só o nome, sem @" error={err("contact.instagram")}>
            <Input id="site-contact.instagram" value={draft.contact.instagram} maxLength={80} onChange={(e) => update((d) => ((d.contact.instagram = e.target.value), d))} />
          </Field>
          <Field id="contact.delivery" label="Entregas" error={err("contact.delivery")}>
            <Input id="site-contact.delivery" value={draft.contact.delivery} maxLength={160} onChange={(e) => update((d) => ((d.contact.delivery = e.target.value), d))} />
          </Field>
        </div>

        <div className="space-y-2">
          <Label>Horário</Label>
          {draft.contact.hours.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Input id={`site-contact.hours.${i}.days`} aria-label={`Dias, linha ${i + 1}`} placeholder="Dias" value={h.days} maxLength={40} aria-invalid={!!err(`contact.hours.${i}.days`)} onChange={(e) => update((d) => ((d.contact.hours[i]!.days = e.target.value), d))} />
              <Input id={`site-contact.hours.${i}.time`} aria-label={`Horário, linha ${i + 1}`} placeholder="09h00 – 18h00" value={h.time} maxLength={40} aria-invalid={!!err(`contact.hours.${i}.time`)} onChange={(e) => update((d) => ((d.contact.hours[i]!.time = e.target.value), d))} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover linha ${i + 1}`} disabled={draft.contact.hours.length <= 1} onClick={() => update((d) => (d.contact.hours.splice(i, 1), d))}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {Object.entries(errors).filter(([k]) => k.startsWith("contact.hours")).slice(0, 1).map(([k, m]) => (
            <p key={k} className="text-sm text-destructive">{m}</p>
          ))}
          {draft.contact.hours.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={() => update((d) => (d.contact.hours.push({ days: "", time: "" }), d))}>
              <Plus /> Adicionar linha
            </Button>
          )}
        </div>

        <Field id="contact.footerText" label="Frase do rodapé" error={err("contact.footerText")}>
          <Textarea id="site-contact.footerText" rows={2} value={draft.contact.footerText} maxLength={200} onChange={(e) => update((d) => ((d.contact.footerText = e.target.value), d))} />
        </Field>
        <PhotoField label="Fotografia da loja" path={draft.contact.storeImagePath} fallback={storeImg.url} onUploaded={(p) => uploaded.current.push(p)} onChange={(p) => update((d) => ((d.contact.storeImagePath = p), d))} />
      </Section>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 md:px-4">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => { setDraft(toForm(saved)); setErrors({}); }}>
            Desfazer alterações
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Guardar alterações
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 shadow-soft md:p-7">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`site-${id}`}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PhotoField({ label, path, fallback, onChange, onUploaded }: {
  label: string;
  path: string | null;
  fallback: string;
  onChange: (path: string | null) => void;
  onUploaded: (path: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState(storageImageUrl(path) ?? fallback);
  useEffect(() => setSrc(storageImageUrl(path) ?? fallback), [path, fallback]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) return toast.error(invalid);
    setBusy(true);
    try {
      const newPath = await uploadImage(file, "site");
      onUploaded(newPath);
      onChange(newPath);
      setSrc(URL.createObjectURL(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio da fotografia");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <img src={src} alt="" className="size-24 shrink-0 rounded-2xl object-cover" />
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" aria-label={`Escolher ${label.toLowerCase()}`} onChange={(e) => onFile(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Trocar fotografia
          </Button>
          {path && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange(null)}>
              <RotateCcw /> Repor original
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A alteração só aparece no site depois de guardar.</p>
    </div>
  );
}
