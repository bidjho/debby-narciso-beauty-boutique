import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  checkTeamAction,
  generateTempPassword,
  inviteSchema,
  levelFromRoles,
  rolesForLevel,
  type AccessLevel,
  type TeamAction,
  type TeamMember,
} from "@/lib/team-rules";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

const BLOCK_DURATION = "876000h"; // ~100 years

async function isOwner(context: Ctx): Promise<boolean> {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  return !error && data === true;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadMembers(): Promise<TeamMember[]> {
  const db = await admin();
  const [{ data: users, error: usersErr }, { data: roles, error: rolesErr }, { data: profiles }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("user_roles").select("user_id, role"),
    db.from("profiles").select("id, full_name"),
  ]);
  if (usersErr || rolesErr) {
    console.error("team list failed", usersErr ?? rolesErr);
    throw new Error("list_failed");
  }
  const rolesBy = new Map<string, string[]>();
  for (const r of roles ?? []) rolesBy.set(r.user_id, [...(rolesBy.get(r.user_id) ?? []), r.role]);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const now = Date.now();
  return users.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      fullName: names.get(u.id) ?? (u.user_metadata?.["full_name"] as string | undefined) ?? null,
      level: levelFromRoles(rolesBy.get(u.id) ?? []),
      blocked: !!u.banned_until && new Date(u.banned_until).getTime() > now,
      lastSignInAt: u.last_sign_in_at ?? null,
      createdAt: u.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function setRoles(userId: string, level: AccessLevel) {
  const db = await admin();
  const keep = rolesForLevel(level);
  const all = ["owner", "admin"] as const;
  const remove = all.filter((r) => !keep.includes(r));
  if (remove.length) {
    const { error } = await db.from("user_roles").delete().eq("user_id", userId).in("role", remove);
    if (error) throw error;
  }
  if (keep.length) {
    const { error } = await db
      .from("user_roles")
      .upsert(keep.map((role) => ({ user_id: userId, role })), { onConflict: "user_id,role", ignoreDuplicates: true });
    if (error) throw error;
  }
}

const FORBIDDEN = "Apenas o dono da loja pode gerir a equipa.";

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ members: TeamMember[]; me: string; error: string | null }> => {
    if (!(await isOwner(context))) return { members: [], me: context.userId, error: FORBIDDEN };
    try {
      return { members: await loadMembers(), me: context.userId, error: null };
    } catch {
      return { members: [], me: context.userId, error: "Não foi possível carregar a equipa." };
    }
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }): Promise<{ error: string | null; email?: string; password?: string; name?: string }> => {
    if (!(await isOwner(context))) return { error: FORBIDDEN };
    const parsed = inviteSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    const { email, fullName, level } = parsed.data;
    const db = await admin();
    const password = generateTempPassword();
    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) {
      const exists = /already|registered|exists/i.test(error?.message ?? "");
      if (!exists) console.error("invite failed", error);
      return { error: exists ? "Já existe uma conta com este e-mail. Use as opções do membro na lista." : "Não foi possível criar o acesso." };
    }
    try {
      await db.from("profiles").upsert({ id: created.user.id, full_name: fullName });
      await setRoles(created.user.id, level);
    } catch (e) {
      console.error("invite roles failed", e);
      return { error: "A conta foi criada, mas não foi possível atribuir o acesso. Tente de novo na lista." };
    }
    return { error: null, email, password, name: fullName };
  });

const ACTIONS: readonly TeamAction[] = ["set_owner", "set_admin", "set_none", "block", "unblock", "reset_password"];

export const updateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; action: TeamAction }) => {
    if (typeof input?.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.userId)) throw new Error("Membro inválido");
    if (!ACTIONS.includes(input.action)) throw new Error("Ação inválida");
    return input;
  })
  .handler(async ({ data, context }): Promise<{ error: string | null; email?: string; password?: string; name?: string | null }> => {
    if (!(await isOwner(context))) return { error: FORBIDDEN };
    let members: TeamMember[];
    try {
      members = await loadMembers();
    } catch {
      return { error: "Não foi possível carregar a equipa." };
    }
    const target = members.find((m) => m.id === data.userId);
    if (!target) return { error: "Membro não encontrado." };
    const activeOwnerCount = members.filter((m) => m.level === "owner" && !m.blocked).length;
    const denied = checkTeamAction({
      action: data.action,
      actorId: context.userId,
      targetId: target.id,
      targetLevel: target.level,
      activeOwnerCount,
    });
    if (denied) return { error: denied };

    const db = await admin();
    try {
      switch (data.action) {
        case "set_owner":
          await setRoles(target.id, "owner");
          break;
        case "set_admin":
          await setRoles(target.id, "admin");
          break;
        case "set_none":
          await setRoles(target.id, "none");
          break;
        case "block": {
          await setRoles(target.id, "none");
          const { error } = await db.auth.admin.updateUserById(target.id, { ban_duration: BLOCK_DURATION });
          if (error) throw error;
          break;
        }
        case "unblock": {
          const { error } = await db.auth.admin.updateUserById(target.id, { ban_duration: "none" });
          if (error) throw error;
          if (target.level === "none") await setRoles(target.id, "admin");
          break;
        }
        case "reset_password": {
          const password = generateTempPassword();
          const { error } = await db.auth.admin.updateUserById(target.id, { password });
          if (error) throw error;
          return { error: null, email: target.email, password, name: target.fullName };
        }
      }
    } catch (e) {
      console.error("team update failed", e);
      return { error: "Não foi possível guardar a alteração." };
    }
    return { error: null };
  });
