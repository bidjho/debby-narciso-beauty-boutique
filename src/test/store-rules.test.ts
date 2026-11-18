import { describe, expect, it } from "vitest";
import { clampQuantity, effectivePrice, formatMZN, hasValidPromo, isOutOfStock } from "@/lib/pricing";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { normalizeMzPhone } from "@/lib/checkout-schema";
import { productFormSchema } from "@/lib/product-form-schema";

const base = {
  name: "Gloss",
  slug: "gloss",
  description: "",
  price: "500",
  promoPrice: "",
  promoActive: false,
  categoryId: "",
  manageStock: false,
  stock: "",
  isActive: true,
  isFeatured: false,
  sortOrder: "0",
};

describe("promotions", () => {
  it("uses the promo price only when active and lower than the normal price", () => {
    expect(effectivePrice({ price: 500, promoPrice: 400, promoActive: true })).toBe(400);
    expect(effectivePrice({ price: 500, promoPrice: 400, promoActive: false })).toBe(500);
    expect(hasValidPromo({ price: 500, promoPrice: 500, promoActive: true })).toBe(false);
  });

  it("rejects a promo price equal to or above the normal price in the admin form", () => {
    expect(productFormSchema.safeParse({ ...base, promoPrice: "500" }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, promoPrice: "600" }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, promoPrice: "450" }).success).toBe(true);
  });

  it("rejects non-positive prices", () => {
    expect(productFormSchema.safeParse({ ...base, price: "0" }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, price: "-10" }).success).toBe(false);
  });
});

describe("stock", () => {
  it("never allows more than the available stock when stock control is on", () => {
    expect(clampQuantity(5, { manageStock: true, stock: 3 })).toBe(3);
    expect(clampQuantity(5, { manageStock: false, stock: 3 })).toBe(5);
    expect(clampQuantity(1, { manageStock: true, stock: 0 })).toBe(0);
    expect(isOutOfStock({ manageStock: true, stock: 0 })).toBe(true);
  });
});

describe("whatsapp order", () => {
  it("opens the store number 258875505550 with an encoded message", () => {
    const url = buildWhatsAppUrl("Olá & obrigada");
    expect(url).toBe("https://wa.me/258875505550?text=Ol%C3%A1%20%26%20obrigada");
  });

  it("includes customer, items, subtotal and delivery to be confirmed", () => {
    const msg = buildOrderMessage(
      { fullName: "Ana Silva", phone: "+258841234567", province: "Nampula", city: "Nampula", address: "Bairro Central" },
      [{ name: "Gloss Rosa", quantity: 2, unitPrice: 450 }],
    );
    expect(msg).toContain("Ana Silva");
    expect(msg).toContain("+258841234567");
    expect(msg).toContain("2 × 450,00 MZN = 900,00 MZN");
    expect(msg).toContain("Subtotal dos produtos:* 900,00 MZN");
    expect(msg).toContain("Custo de entrega:* A confirmar");
  });

  it("formats MZN amounts", () => {
    expect(formatMZN(1250).replace(/\u00A0/g, " ")).toBe("1 250,00 MZN");
  });

  it("accepts Mozambican mobile numbers", () => {
    expect(normalizeMzPhone("84 123 4567")).toBe("+258841234567");
    expect(normalizeMzPhone("+258 87 550 5550")).toBe("+258875505550");
    expect(normalizeMzPhone("12345")).toBeNull();
  });
});
