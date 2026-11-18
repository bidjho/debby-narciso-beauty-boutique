import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/conta")({
  component: AdminAccount,
});

const schema = z
  .object({
    password: z.string().min(8, "Use pelo menos 8 caracteres").max(128, "Máximo 128 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "As palavras-passe não coincidem", path: ["confirm"] });

function AdminAccount() {
  const { user } = Route.useRouteContext();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSaving(false);
    if (err) {
      setError("Não foi possível alterar a palavra-passe. Tente novamente.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Palavra-passe alterada");
  }

  return (
    <div className="max-w-md">
      <p className="eyebrow text-gold">Conta</p>
      <h1 className="mt-1 text-3xl font-semibold">A minha conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sessão iniciada como {user.email}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-3xl bg-card p-6 shadow-soft" noValidate>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="size-5 text-primary" aria-hidden /> Alterar palavra-passe</h2>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nova palavra-passe</Label>
          <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirmar palavra-passe</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving && <Loader2 className="animate-spin" />} Guardar nova palavra-passe
        </Button>
      </form>
    </div>
  );
}
