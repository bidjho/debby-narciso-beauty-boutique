import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";
const MAX_SIDE = 1600;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Formato não suportado. Use JPG, PNG ou WEBP.";
  if (file.size > 20 * 1024 * 1024) return "A fotografia é demasiado grande (máximo 20 MB).";
  return null;
}

/** Resize to MAX_SIDE and convert to WEBP in the browser; falls back to the original file. */
async function optimize(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (blob && blob.size > 0) return { blob, ext: "webp", type: "image/webp" };
  } catch {
    // fall through
  }
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return { blob: file, ext, type: file.type };
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const { blob, ext, type } = await optimize(file);
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("A fotografia continua demasiado grande após otimização.");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error("Falha no envio da fotografia: " + error.message);
  return path;
}

export async function removeImages(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length === 0) return;
  await supabase.storage.from(BUCKET).remove(list);
}

export function dbErrorMessage(err: { code?: string; message?: string } | null | undefined, fallback = "Ocorreu um erro.") {
  if (!err) return fallback;
  if (err.code === "23505") return "Já existe um registo com este slug. Escolha outro.";
  if (err.code === "23503") return "Esta categoria tem produtos associados. Mova ou elimine esses produtos primeiro.";
  if (err.code === "23514") return "Valores inválidos. Verifique os preços e o stock.";
  if (err.code === "42501") return "Sem permissão para esta ação.";
  return err.message || fallback;
}
