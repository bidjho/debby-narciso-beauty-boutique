import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-oficial-debby-narciso.png.asset.json";

type AuthSearch = { redirect?: string | undefined };

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Palavra-passe demasiado curta").max(128),
});

function safeRedirect(r?: string) {
  return r && r.startsWith("/admin") && !r.startsWith("//") ? r : "/admin";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (raw: Record<string, unknown>): AuthSearch =>
    typeof raw["redirect"] === "string" ? { redirect: raw["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Entrar — Painel Debby Narciso Cosméticos" },
      { name: "description", content: "Acesso reservado à administração da loja." },
      { property: "og:title", content: "Entrar — Painel Debby Narciso Cosméticos" },
      { property: "og:description", content: "Acesso reservado à administração da loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: safeRedirect(redirect), replace: true });
    });
  }, [navigate, redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (err) {
      setError(err.message.toLowerCase().includes("invalid") ? "Email ou palavra-passe incorretos." : "Não foi possível entrar. Tente novamente.");
      return;
    }
    navigate({ to: safeRedirect(redirect), replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-blush px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-soft">
        <img src={logo.url} alt="Debby Narciso Cosmetics" className="mx-auto h-16 w-auto" />
        <h1 className="mt-6 text-center text-3xl font-semibold">Painel da loja</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Acesso reservado à administração.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <Lock /> {loading ? "A entrar…" : "Entrar"}
          </Button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary">Voltar à loja</Link>
      </div>
    </div>
  );
}
