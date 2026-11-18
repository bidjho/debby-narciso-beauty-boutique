import { STORE } from "./store-config";
import { formatMZN } from "./pricing";

export type OrderLine = { name: string; quantity: number; unitPrice: number };

export type OrderCustomer = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  notes?: string | undefined;
};

export function orderSubtotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function buildOrderMessage(customer: OrderCustomer, lines: OrderLine[]): string {
  const items = lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name}\n   ${l.quantity} × ${formatMZN(l.unitPrice)} = ${formatMZN(l.unitPrice * l.quantity)}`,
    )
    .join("\n");
  const parts = [
    `Olá ${STORE.shortName}! Gostaria de fazer esta encomenda:`,
    "",
    "*Cliente*",
    `Nome: ${customer.fullName}`,
    `Telefone: ${customer.phone}`,
    "",
    "*Entrega*",
    `Província: ${customer.province}`,
    `Cidade/Distrito: ${customer.city}`,
    `Endereço: ${customer.address}`,
    "",
    "*Produtos*",
    items,
    "",
    `*Subtotal dos produtos:* ${formatMZN(orderSubtotal(lines))}`,
    "*Custo de entrega:* A confirmar",
  ];
  if (customer.notes && customer.notes.trim()) {
    parts.push("", `*Observações:* ${customer.notes.trim()}`);
  }
  parts.push("", "Aguardo a confirmação da disponibilidade e do custo de entrega. Obrigada!");
  return parts.join("\n").replace(/\u00A0/g, " ");
}

export function buildWhatsAppUrl(message: string, number: string = STORE.whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function whatsappChatUrl(text?: string): string {
  return text ? buildWhatsAppUrl(text) : `https://wa.me/${STORE.whatsappNumber}`;
}
