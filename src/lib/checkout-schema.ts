import { z } from "zod";
import { PROVINCES } from "./store-config";

/** Accepts Mozambican numbers like 84 123 4567, 841234567, +258 84 123 4567. */
export function normalizeMzPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const local = digits.startsWith("258") ? digits.slice(3) : digits;
  if (/^8[2-7]\d{7}$/.test(local) || /^2\d{7,8}$/.test(local)) return `+258${local}`;
  return null;
}

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Indique o nome completo")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeMzPhone(v) !== null, "Número inválido. Ex.: 84 123 4567"),
  province: z.enum(PROVINCES, { errorMap: () => ({ message: "Escolha a província" }) }),
  city: z.string().trim().min(2, "Indique a cidade ou distrito").max(100, "Máximo 100 caracteres"),
  address: z
    .string()
    .trim()
    .min(5, "Indique o endereço de entrega")
    .max(300, "Máximo 300 caracteres"),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
