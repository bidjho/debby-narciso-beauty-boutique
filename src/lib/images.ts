/** Public URL for an image stored in the product-images bucket (served through /img). */
export function storageImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/img/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const SAFE_STORAGE_PATH = /^(?!.*\.\.)[A-Za-z0-9_\-/]+\.(webp|jpe?g|png|gif|avif)$/i;
