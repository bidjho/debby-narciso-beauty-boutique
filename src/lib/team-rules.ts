import { z } from "zod";

/** Access levels shown in the team panel. Owners always also hold the admin role. */
export type AccessLevel = "owner" | "admin" | "none";
export type AppRole = "owner" | "admin";

export const LEVEL_LABEL: Record<AccessLevel, string> = {
  owner: "Dono da loja",
  admin: "Administradora",
  none: "Sem acesso",
};

export type TeamMember = {
  id: string;
  email: string;
  fullName: string | null;
  level: AccessLevel;
  blocked: boolean;
  lastSignInAt: string | null;
  createdAt: string;
};

export type TeamAction = "set_owner" | "set_admin" | "set_none" | "block" | "unblock" | "reset_password";

/** Roles a member must hold for a given level. */
export function rolesForLevel(level: AccessLevel): AppRole[] {
  if (level === "owner") return ["owner", "admin"];
  if (level === "admin") return ["admin"];
  return [];
}

export function levelFromRoles(roles: readonly string[]): AccessLevel {
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  return "none";
}

/**
 * Returns a Portuguese error message when the action is not allowed, or null when it is.
 * - Nobody can change their own access (avoids locking yourself out).
 * - The store must always keep at least one active owner.
 */
export function checkTeamAction(input: {
  action: TeamAction;
  actorId: string;
  targetId: string;
  targetLevel: AccessLevel;
  activeOwnerCount: number;
}): string | null {
  if (input.actorId === input.targetId) {
    return "Não pode alterar o seu próprio acesso. Peça a outro dono da loja.";
  }
  const removesOwner =
    input.targetLevel === "owner" && (input.action === "set_admin" || input.action === "set_none" || input.action === "block");
  if (removesOwner && input.activeOwnerCount <= 1) {
    return "A loja precisa de ter pelo menos um dono.";
  }
  return null;
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Temporary password for a new or reset member, without ambiguous characters (0/O, 1/l/I). */
export function generateTempPassword(length = 12): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length];
  return out;
}

export const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Indique o nome").max(120, "Máximo 120 caracteres"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  level: z.enum(["owner", "admin"]),
});
export type InviteInput = z.infer<typeof inviteSchema>;

export function buildAccessMessage(p: { name: string | null; email: string; password: string; loginUrl: string }): string {
  return [
    `Olá${p.name ? ` ${p.name}` : ""}! O seu acesso ao painel da Debby Narciso Cosmetics está pronto.`,
    "",
    `Entrar: ${p.loginUrl}`,
    `E-mail: ${p.email}`,
    `Palavra-passe temporária: ${p.password}`,
    "",
    "Depois de entrar, altere a palavra-passe em «Conta».",
  ].join("\n");
}
