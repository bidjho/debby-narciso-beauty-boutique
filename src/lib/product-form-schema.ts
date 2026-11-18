import { z } from "zod";
import { SLUG_PATTERN } from "./slug";

const money = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Indique o ${label}`)
    .transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n > 0, `O ${label} deve ser um valor positivo`)
    .refine((n) => n < 10_000_000_000, "Valor demasiado alto");

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Indique o nome").max(160, "Máximo 160 caracteres"),
    slug: z.string().trim().regex(SLUG_PATTERN, "Use apenas letras minúsculas, números e hífens").max(80),
    description: z.string().trim().max(5000, "Máximo 5000 caracteres"),
    price: money("preço"),
    promoPrice: z.string().trim(),
    promoActive: z.boolean(),
    categoryId: z.string(),
    manageStock: z.boolean(),
    stock: z.string().trim(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.string().trim(),
  })
  .transform((v, ctx) => {
    let promoPrice: number | null = null;
    if (v.promoPrice !== "") {
      promoPrice = Number(v.promoPrice.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(promoPrice) || promoPrice <= 0) {
        ctx.addIssue({ code: "custom", path: ["promoPrice"], message: "O preço promocional deve ser positivo" });
      } else if (promoPrice >= v.price) {
        ctx.addIssue({ code: "custom", path: ["promoPrice"], message: "O preço promocional tem de ser menor que o preço normal" });
      }
    }
    if (v.promoActive && promoPrice === null) {
      ctx.addIssue({ code: "custom", path: ["promoPrice"], message: "Indique o preço promocional para ativar a promoção" });
    }
    let stock: number | null = null;
    if (v.manageStock) {
      stock = Number(v.stock);
      if (v.stock === "" || !Number.isInteger(stock) || stock < 0) {
        ctx.addIssue({ code: "custom", path: ["stock"], message: "Indique um stock inteiro, igual ou superior a 0" });
      }
    } else if (v.stock !== "") {
      const s = Number(v.stock);
      stock = Number.isInteger(s) && s >= 0 ? s : null;
    }
    const sortOrder = v.sortOrder === "" ? 0 : Number(v.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      ctx.addIssue({ code: "custom", path: ["sortOrder"], message: "A ordem deve ser um número inteiro" });
    }
    return {
      name: v.name,
      slug: v.slug,
      description: v.description || null,
      price: v.price,
      promo_price: promoPrice,
      promo_active: v.promoActive && promoPrice !== null,
      category_id: v.categoryId || null,
      manage_stock: v.manageStock,
      stock,
      is_active: v.isActive,
      is_featured: v.isFeatured,
      sort_order: Number.isInteger(sortOrder) ? sortOrder : 0,
    };
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
