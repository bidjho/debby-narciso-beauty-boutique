import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Copy, Crown, KeyRound, Loader2, MessageCircle, MoreVertical, ShieldCheck, ShieldOff, UserPlus, UserCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { inviteMember, listTeam, updateMember } from "@/lib/team.functions";
import { buildAccessMessage, inviteSchema, LEVEL_LABEL, type TeamAction, type TeamMember } from "@/lib/team-rules";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/_authenticated/admin/equipa")({
  component: AdminTeam,
});

type Credentials = { name: string | null; email: string; password: string; title: string };

const CONFIRM: Partial<Record<TeamAction, { title: string; body: (m: TeamMember) => string; cta: string; destructive?: boolean }>> = {
  set_owner: { title: "Tornar dono da loja?", body: (m) => `${m.email} poderá gerir produtos e também convidar, alterar e bloquear membros da equipa.`, cta: "Tornar dono" },
  set_none: { title: "Remover acesso de administradora?", body: (m) => `${m.email} deixa de conseguir gerir a loja. A conta continua a existir e pode voltar a receber acesso.`, cta: "Remover acesso", destructive: true },
  block: { title: "Bloquear acesso?", body: (m) => `${m.email} deixa de conseguir entrar no painel e perde todos os acessos. Pode reativar mais tarde.`, cta: "Bloquear", destructive: true },
  reset_password: { title: "Gerar nova palavra-passe?", body: (m) => `A palavra-passe atual de ${m.email} deixa de funcionar. Vai receber uma nova para enviar a este membro.`, cta: "Gerar" },
};

const DONE: Record<TeamAction, string> = {
  set_owner: "Agora é dono da loja",
  set_admin: "Agora é administradora",
  set_none: "Acesso de administradora removido",
  block: "Acesso bloqueado",
  unblock: "Acesso reativado",
  reset_password: "Nova palavra-passe gerada",
};

function formatDate(iso: string | null) {
  if (!iso) return "Nunca entrou";
  return `Última entrada: ${new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}`;
}

function AdminTeam() {
  const qc = useQueryClient();
  const fetchTeam = useServerFn(listTeam);
  const invite = useServerFn(inviteMember);
  const update = useServerFn(updateMember);
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin", "team"], queryFn: () => fetchTeam() });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ member: TeamMember; action: TeamAction } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  async function run(member: TeamMember, action: TeamAction) {
    setBusyId(member.id);
    try {
      const res = await update({ data: { userId: member.id, action } });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(DONE[action]);
      if (res.password && res.email) {
        setCredentials({ name: res.name ?? null, email: res.email, password: res.password, title: "Nova palavra-passe" });
      }
      await qc.invalidateQueries({ queryKey: ["admin", "team"] });
    } catch {
      toast.error("Não foi possível guardar a alteração.");
    } finally {
      setBusyId(null);
    }
  }

  function request(member: TeamMember, action: TeamAction) {
    if (CONFIRM[action]) setConfirm({ member, action });
    else void run(member, action);
  }

  const members = data?.members ?? [];
  const confirmCfg = confirm ? CONFIRM[confirm.action] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">Equipa</p>
          <h1 className="mt-1 text-3xl font-semibold">Equipa e acessos</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Convide pessoas para gerir a loja, mude o nível de acesso ou bloqueie contas que já não devem entrar.
          </p>
        </div>
        {!data?.error && (
          <Button onClick={() => setInviteOpen(true)}><UserPlus /> Convidar membro</Button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-3xl bg-card p-6 text-sm text-muted-foreground shadow-soft"><Loader2 className="size-4 animate-spin" /> A carregar equipa…</div>
        )}
        {(isError || data?.error) && (
          <div className="rounded-3xl bg-card p-6 text-sm text-destructive shadow-soft" role="alert">{data?.error ?? "Não foi possível carregar a equipa."}</div>
        )}
        {members.map((m) => {
          const isMe = m.id === data?.me;
          return (
            <div key={m.id} className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft md:p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-primary">
                {(m.fullName ?? m.email).trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.fullName ?? m.email}{isMe && <span className="text-muted-foreground"> (você)</span>}</p>
                {m.fullName && <p className="truncate text-sm text-muted-foreground">{m.email}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {m.blocked ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : (
                    <Badge variant={m.level === "none" ? "outline" : "secondary"} className={m.level === "owner" ? "bg-gold/15 text-gold" : undefined}>
                      {m.level === "owner" && <Crown className="size-3" aria-hidden />} {LEVEL_LABEL[m.level]}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(m.lastSignInAt)}</span>
                </div>
              </div>
              {!isMe && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Opções para ${m.email}`} disabled={busyId === m.id}>
                      {busyId === m.id ? <Loader2 className="animate-spin" /> : <MoreVertical />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    {m.blocked ? (
                      <DropdownMenuItem onSelect={() => request(m, "unblock")}><UserCheck /> Reativar acesso</DropdownMenuItem>
                    ) : (
                      <>
                        {m.level !== "owner" && <DropdownMenuItem onSelect={() => request(m, "set_owner")}><Crown /> Tornar dono da loja</DropdownMenuItem>}
                        {m.level !== "admin" && <DropdownMenuItem onSelect={() => request(m, "set_admin")}><ShieldCheck /> {m.level === "owner" ? "Mudar para administradora" : "Dar acesso de administradora"}</DropdownMenuItem>}
                        {m.level !== "none" && <DropdownMenuItem onSelect={() => request(m, "set_none")}><ShieldOff /> Remover acesso de administradora</DropdownMenuItem>}
                        <DropdownMenuItem onSelect={() => request(m, "reset_password")}><KeyRound /> Gerar nova palavra-passe</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => request(m, "block")}><Ban /> Bloquear acesso</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={async (values) => {
          const res = await invite({ data: values });
          if (res.error) return res.error;
          setInviteOpen(false);
          toast.success("Membro convidado");
          await qc.invalidateQueries({ queryKey: ["admin", "team"] });
          if (res.email && res.password) setCredentials({ name: res.name ?? null, email: res.email, password: res.password, title: "Acesso criado" });
          return null;
        }}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCfg?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm && confirmCfg?.body(confirm.member)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmCfg?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => {
                if (confirm) void run(confirm.member, confirm.action);
                setConfirm(null);
              }}
            >
              {confirmCfg?.cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}

function InviteDialog({ open, onOpenChange, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: { fullName: string; email: string; level: "owner" | "admin" }) => Promise<string | null>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<"owner" | "admin">("admin");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = inviteSchema.safeParse({ fullName, email, level });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSaving(true);
    try {
      const err = await onSubmit(parsed.data);
      if (err) setError(err);
      else {
        setFullName("");
        setEmail("");
        setLevel("admin");
      }
    } catch {
      setError("Não foi possível criar o acesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>Criamos a conta e mostramos uma palavra-passe temporária para enviar pelo WhatsApp.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Nome</Label>
            <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input id="invite-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label>Nível de acesso</Label>
            <RadioGroup value={level} onValueChange={(v) => setLevel(v as "owner" | "admin")} className="gap-2">
              <label htmlFor="lvl-admin" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3">
                <RadioGroupItem id="lvl-admin" value="admin" className="mt-0.5" />
                <span><span className="block text-sm font-medium">Administradora</span><span className="block text-xs text-muted-foreground">Gere produtos, fotografias, promoções e categorias.</span></span>
              </label>
              <label htmlFor="lvl-owner" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3">
                <RadioGroupItem id="lvl-owner" value="owner" className="mt-0.5" />
                <span><span className="block text-sm font-medium">Dono da loja</span><span className="block text-xs text-muted-foreground">Tudo o que a administradora faz, e também gere a equipa.</span></span>
              </label>
            </RadioGroup>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Criar acesso</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({ credentials, onClose }: { credentials: Credentials | null; onClose: () => void }) {
  const message = credentials
    ? buildAccessMessage({ name: credentials.name, email: credentials.email, password: credentials.password, loginUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/auth` })
    : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Dialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{credentials?.title}</DialogTitle>
          <DialogDescription>Envie estes dados ao membro. Por segurança, esta palavra-passe só é mostrada agora.</DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="space-y-4">
            <dl className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
              <div><dt className="text-muted-foreground">E-mail</dt><dd className="font-medium break-all">{credentials.email}</dd></div>
              <div><dt className="text-muted-foreground">Palavra-passe temporária</dt><dd className="font-mono text-base font-semibold tracking-wide" data-testid="temp-password">{credentials.password}</dd></div>
            </dl>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle /> Enviar por WhatsApp</a>
              </Button>
              <Button variant="outline" onClick={copy}><Copy /> Copiar mensagem</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={onClose}>Concluído</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
