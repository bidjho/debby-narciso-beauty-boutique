import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FolderTree, LayoutDashboard, LogOut, Package, ShieldAlert, UserCog, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-oficial-debby-narciso.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const [adminRes, ownerRes] = await Promise.all([
      supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: context.user.id, _role: "owner" }),
    ]);
    return {
      isAdmin: !adminRes.error && adminRes.data === true,
      isOwner: !ownerRes.error && ownerRes.data === true,
    };
  },
  head: () => ({
    meta: [
      { title: "Painel — Debby Narciso Cosmetics" },
      { name: "description", content: "Painel de administração da loja." },
      { property: "og:title", content: "Painel — Debby Narciso Cosmetics" },
      { property: "og:description", content: "Painel de administração da loja." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Resumo", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree, exact: false },
  { to: "/admin/equipa", label: "Equipa", icon: Users, exact: false, ownerOnly: true },
  { to: "/admin/conta", label: "Conta", icon: UserCog, exact: false },
] as const;

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AdminLayout() {
  const { isAdmin, isOwner, user } = Route.useRouteContext();
  const nav = NAV.filter((n) => !("ownerOnly" in n) || isOwner);
  const signOut = useSignOut();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-blush px-4">
        <div className="max-w-sm rounded-3xl bg-card p-8 text-center shadow-soft">
          <ShieldAlert className="mx-auto size-10 text-destructive" aria-hidden />
          <h1 className="mt-4 text-3xl font-semibold">Sem permissão</h1>
          <p className="mt-2 text-sm text-muted-foreground">A conta {user.email} não tem acesso de administração.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={signOut}><LogOut /> Terminar sessão</Button>
            <Button asChild variant="outline"><Link to="/">Voltar à loja</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-20 md:pb-0 md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <img src={logo.url} alt="Debby Narciso Cosmetics" className="h-14 w-auto self-start" />
        <p className="eyebrow mt-3 text-gold">Painel</p>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Administração">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}>
              <n.icon className="size-4" aria-hidden /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 text-sm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent"><ExternalLink className="size-4" aria-hidden /> Ver loja</a>
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent"><LogOut className="size-4" aria-hidden /> Sair</button>
          <p className="truncate px-3 pt-2 text-xs text-sidebar-foreground/60">{user.email}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <img src={logo.url} alt="Debby Narciso Cosmetics" className="h-9 w-auto" />
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-full hover:bg-accent" aria-label="Ver loja"><ExternalLink className="size-4" /></a>
          <button type="button" onClick={signOut} className="flex size-10 items-center justify-center rounded-full hover:bg-accent" aria-label="Sair"><LogOut className="size-4" /></button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card md:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }} aria-label="Administração">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <n.icon className="size-5" aria-hidden /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
