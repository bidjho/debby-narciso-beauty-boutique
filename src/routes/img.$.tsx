import { createFileRoute } from "@tanstack/react-router";
import { SAFE_STORAGE_PATH } from "@/lib/images";

// Serves product/category/site photos from the private storage bucket with long-lived caching.
// Visitors have no direct storage access (no listing/reading of the bucket); this route reads
// on the server, only for validated paths inside the store's photo folders. Paths are random
// UUIDs per upload, so caching is safe.
const ALLOWED_FOLDERS = /^(products|categories|site)\//;

export const Route = createFileRoute("/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        let path: string;
        try {
          path = decodeURIComponent(params._splat ?? "");
        } catch {
          return new Response("Not found", { status: 404 });
        }
        if (!SAFE_STORAGE_PATH.test(path) || !ALLOWED_FOLDERS.test(path)) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
          if (error || !data) return new Response("Not found", { status: 404 });
          return new Response(data, {
            status: 200,
            headers: {
              "content-type": data.type || "image/webp",
              "cache-control": "public, max-age=31536000, immutable",
              "x-content-type-options": "nosniff",
            },
          });
        } catch {
          return new Response("Unavailable", { status: 503 });
        }
      },
    },
  },
});
