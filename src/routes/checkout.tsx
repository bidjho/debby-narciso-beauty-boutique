import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { checkoutSchema, normalizeMzPhone, type CheckoutValues } from "@/lib/checkout-schema";
import { formatMZN } from "@/lib/pricing";
import { PROVINCES } from "@/lib/store-config";
import { useCartRefresh } from "@/lib/use-cart-refresh";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatStorePhone } from "@/lib/site-content";
import { useSite } from "@/lib/use-site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shop/EmptyState";
import { WhatsAppIcon } from "@/components/shop/icons";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar encomenda — Debby Narciso Cosmetics" },
      { name: "description", content: "Indique os dados de entrega e envie a sua encomenda pelo WhatsApp." },
      { property: "og:title", content: "Finalizar encomenda — Debby Narciso Cosmetics" },
      { property: "og:description", content: "Envie a sua encomenda pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type FormState = Record<keyof CheckoutValues, string>;
const EMPTY: FormState = { fullName: "", phone: "", province: "", city: "", address: "", notes: "" };

function CheckoutPage() {
  const { items, ready, subtotal, clear } = useCart();
  const { status } = useCartRefresh();
  const { contact } = useSite();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutValues, string>>>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const set = (k: keyof CheckoutValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CheckoutValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof CheckoutValues;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) document.getElementById(`co-${first}`)?.focus();
      return;
    }
    const d = parsed.data;
    const message = buildOrderMessage(
      { ...d, phone: normalizeMzPhone(d.phone) ?? d.phone, notes: d.notes || undefined },
      items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    );
    const url = buildWhatsAppUrl(message, contact.whatsappNumber);
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    setPopupBlocked(!win);
    setSentUrl(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready) return <div className="container-shop py-16"><div className="h-40 animate-pulse rounded-3xl bg-muted" /></div>;

  if (sentUrl) {
    return (
      <div className="container-shop max-w-2xl py-12">
        <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp">
            <WhatsAppIcon className="size-7" />
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Falta só enviar a mensagem</h1>
          <p className="mt-3 text-muted-foreground">
            {popupBlocked
              ? "O WhatsApp não abriu automaticamente. Toque no botão abaixo para abrir a conversa."
              : "Abrimos o WhatsApp com a sua encomenda já escrita. Na conversa aberta, toque em enviar."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            A encomenda só fica confirmada depois de a loja responder no WhatsApp com a disponibilidade e o custo de entrega.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="whatsapp" size="lg">
              <a href={sentUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {popupBlocked ? "Abrir WhatsApp" : "Abrir o WhatsApp novamente"}</a>
            </Button>
            <Button variant="outline" size="lg" onClick={() => setSentUrl(null)}>Voltar aos dados</Button>
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">Já enviou a mensagem?</p>
            <Button asChild variant="ghost" className="mt-2" onClick={() => clear()}>
              <Link to="/"><CheckCircle2 /> Sim, esvaziar carrinho e voltar ao início</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-12">
        <EmptyState icon={<ShoppingBag className="size-6" aria-hidden />} title="O seu carrinho está vazio" description="Adicione produtos antes de finalizar a encomenda." action={<Button asChild><Link to="/loja">Ir para a loja</Link></Button>} />
      </div>
    );
  }

  return (
    <div className="container-shop py-8 md:py-12">
      <h1 className="text-4xl font-semibold md:text-5xl">Finalizar encomenda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Preencha os dados de entrega. Vamos preparar a mensagem para enviar pelo WhatsApp ({formatStorePhone(contact.whatsappNumber)}).</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl bg-card p-6 shadow-soft md:p-8">
          <Field id="fullName" label="Nome completo" error={errors.fullName}>
            <Input id="co-fullName" autoComplete="name" value={values.fullName} onChange={set("fullName")} aria-invalid={!!errors.fullName} maxLength={100} />
          </Field>
          <Field id="phone" label="Número de telefone" error={errors.phone} hint="Ex.: 84 123 4567">
            <Input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} maxLength={20} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="province" label="Província" error={errors.province}>
              <select id="co-province" value={values.province} onChange={set("province")} aria-invalid={!!errors.province} className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30">
                <option value="">Escolha…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field id="city" label="Cidade ou distrito" error={errors.city}>
              <Input id="co-city" autoComplete="address-level2" value={values.city} onChange={set("city")} aria-invalid={!!errors.city} maxLength={100} />
            </Field>
          </div>
          <Field id="address" label="Endereço de entrega" error={errors.address} hint="Bairro, rua, número de casa ou ponto de referência">
            <Textarea id="co-address" autoComplete="street-address" rows={3} value={values.address} onChange={set("address")} aria-invalid={!!errors.address} maxLength={300} />
          </Field>
          <Field id="notes" label="Observações (opcional)" error={errors.notes}>
            <Textarea id="co-notes" rows={3} value={values.notes} onChange={set("notes")} maxLength={500} />
          </Field>
          <Button type="submit" variant="whatsapp" size="lg" className="w-full" disabled={status === "checking"}>
            <WhatsAppIcon /> {status === "checking" ? "A verificar o carrinho…" : "Enviar encomenda pelo WhatsApp"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Sem pagamento online. A loja confirma a encomenda e o custo de entrega pelo WhatsApp.</p>
        </form>

        <aside className="h-fit rounded-3xl bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold">A sua encomenda</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 py-3">
                <span><span className="font-medium">{i.quantity} ×</span> {i.name}</span>
                <span className="shrink-0">{formatMZN(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal dos produtos</dt><dd className="font-semibold">{formatMZN(subtotal)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Custo de entrega</dt><dd>A confirmar</dd></div>
            <div className="flex justify-between border-t border-border pt-3 text-base"><dt>Total dos produtos</dt><dd className="font-semibold">{formatMZN(subtotal)}</dd></div>
          </dl>
          <Link to="/carrinho" className="mt-4 inline-block text-sm text-primary hover:underline">Editar carrinho</Link>
        </aside>
      </div>
    </div>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`co-${id}`}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
