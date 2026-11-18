import { createFileRoute } from "@tanstack/react-router";
import { SAFE_STORAGE_PATH } from "@/lib/images";

// Serves product/category photos from the private storage bucket with long-lived caching.
// Visitors may read this bucket (storage policy); paths are unique per upload, so caching is safe.
export const Route = createFileRoute("/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(params._splat ?? "");
        if (!SAFE_STORAGE_PATH.test(path)) return new Response("Not found", { status: 404 });
        const base = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!base || !key) return new Response("Unavailable", { status: 503 });
        const encoded = path.split("/").map(encodeURIComponent).join("/");
        const res = await fetch(`${base}/storage/v1/object/authenticated/product-images/${encoded}`, {
          headers: { apikey: key },
        });
        if (!res.ok || !res.body) return new Response("Not found", { status: 404 });
        return new Response(res.body, {
          status: 200,
          headers: {
            "content-type": res.headers.get("content-type") ?? "image/webp",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
