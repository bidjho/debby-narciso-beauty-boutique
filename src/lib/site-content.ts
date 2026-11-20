import { z } from "zod";

/**
 * Editable site content (texts, photos, contacts). Stored as one JSON row in `site_content`
 * and edited in the panel («Site»). Missing or invalid sections fall back to these defaults,
 * so the site never breaks because of an incomplete edit.
 */

const text = (max: number, msg = "Preencha este campo") => z.string().trim().min(1, msg).max(max, `Máximo ${max} caracteres`);
const imagePath = z.string().trim().max(300).nullable();

/** Mozambican WhatsApp/phone number → digits with country code, e.g. "258875505550". */
export function normalizeStorePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("258") ? digits.slice(3) : digits;
  if (/^8[2-7]\d{7}$/.test(local) || /^2\d{7,8}$/.test(local)) return `258${local}`;
  return null;
}

/** "258875505550" → "+258 87 550 5550". */
export function formatStorePhone(digits: string): string {
  const local = digits.startsWith("258") ? digits.slice(3) : digits;
  if (local.length === 9) return `+258 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  return `+258 ${local}`;
}

const phone = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => normalizeStorePhone(v) !== null, `${label} inválido. Ex.: 87 550 5550`)
    .transform((v) => normalizeStorePhone(v) as string);

const heroSchema = z.object({
  eyebrow: text(60),
  titleLine1: text(60),
  titleHighlight: z.string().trim().max(60, "Máximo 60 caracteres"),
  subtitle: text(300),
  badge: z.string().trim().max(60, "Máximo 60 caracteres"),
  imagePath,
});

const benefitSchema = z.object({ title: text(60), text: text(200) });

const editorialSchema = z.object({
  eyebrow: z.string().trim().max(60, "Máximo 60 caracteres"),
  text: text(160),
  image1Path: imagePath,
  image2Path: imagePath,
});

const contactSchema = z.object({
  address: text(120),
  city: text(80),
  hours: z
    .array(z.object({ days: text(40, "Indique os dias"), time: text(40, "Indique o horário") }))
    .min(1, "Indique pelo menos um horário")
    .max(6, "Máximo 6 linhas de horário"),
  whatsappNumber: phone("Número de WhatsApp"),
  altPhone: phone("Telefone"),
  delivery: text(160),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, ""))
    .refine((v) => /^[A-Za-z0-9._]{1,30}$/.test(v), "Nome de Instagram inválido"),
  storeImagePath: imagePath,
  footerText: text(200),
});

export const siteContentSchema = z.object({
  hero: heroSchema,
  benefits: z.array(benefitSchema).length(3),
  editorial: editorialSchema,
  contact: contactSchema,
});

export type SiteContent = z.output<typeof siteContentSchema>;

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Debby Narciso Cosmetics",
    titleLine1: "A sua beleza,",
    titleHighlight: "com assinatura.",
    subtitle: "Cosméticos escolhidos com carinho em Nampula. Escolha os seus favoritos e encomende diretamente pelo WhatsApp.",
    badge: "Cadri Shopping · Nampula",
    imagePath: null,
  },
  benefits: [
    { title: "Loja física em Nampula", text: "Cadri Shopping, loja nº 48. Venha experimentar e conhecer-nos." },
    { title: "Encomendas pelo WhatsApp", text: "Escolha os produtos, envie a encomenda e confirmamos consigo." },
    { title: "Entregas em todo o país", text: "Enviamos para todas as províncias de Moçambique." },
  ],
  editorial: {
    eyebrow: "Feito para si",
    text: "Cores que realçam todos os tons de pele.",
    image1Path: null,
    image2Path: null,
  },
  contact: {
    address: "Cadri Shopping, loja nº 48",
    city: "Nampula, Moçambique",
    hours: [
      { days: "Segunda a sexta", time: "09h00 – 18h30" },
      { days: "Sábado", time: "09h00 – 14h00" },
    ],
    whatsappNumber: "258875505550",
    altPhone: "258864648527",
    delivery: "Entregas para todas as províncias de Moçambique",
    instagram: "debbynarciso_cosmetics",
    storeImagePath: null,
    footerText: "Cosméticos em Nampula, com entregas para todas as províncias de Moçambique.",
  },
};

/** Reads stored JSON leniently: each valid section is used, invalid or missing ones use the defaults. */
export function mergeSiteContent(raw: unknown): SiteContent {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_SITE_CONTENT };
  const hero = heroSchema.safeParse({ ...DEFAULT_SITE_CONTENT.hero, ...(obj["hero"] as object | undefined) });
  if (hero.success) out.hero = hero.data;
  const benefits = z.array(benefitSchema).length(3).safeParse(obj["benefits"]);
  if (benefits.success) out.benefits = benefits.data;
  const editorial = editorialSchema.safeParse({ ...DEFAULT_SITE_CONTENT.editorial, ...(obj["editorial"] as object | undefined) });
  if (editorial.success) out.editorial = editorial.data;
  const contact = contactSchema.safeParse({ ...DEFAULT_SITE_CONTENT.contact, ...(obj["contact"] as object | undefined) });
  if (contact.success) out.contact = contact.data;
  return out;
}

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

/** All photo paths referenced by the content (used to clean up replaced photos). */
export function sitePhotoPaths(c: SiteContent): string[] {
  return [c.hero.imagePath, c.editorial.image1Path, c.editorial.image2Path, c.contact.storeImagePath].filter(
    (p): p is string => !!p,
  );
}
