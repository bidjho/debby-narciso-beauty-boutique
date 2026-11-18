import { createFileRoute } from "@tanstack/react-router";
import { createPublicClient } from "@/lib/public-db.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const db = createPublicClient();
        const [{ data: products }, { data: categories }] = await Promise.all([
          db.from("products").select("slug,updated_at").eq("is_active", true).limit(1000),
          db.from("categories").select("slug,updated_at").eq("is_active", true).limit(500),
        ]);
        const urls: { loc: string; lastmod?: string }[] = [
          { loc: `${origin}/` },
          { loc: `${origin}/loja` },
          ...(categories ?? []).map((c) => ({
            loc: `${origin}/loja?categoria=${encodeURIComponent(c.slug)}`,
            lastmod: c.updated_at,
          })),
          ...(products ?? []).map((p) => ({
            loc: `${origin}/produto/${encodeURIComponent(p.slug)}`,
            lastmod: p.updated_at,
          })),
        ];
        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            (u) =>
              `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`,
          )
          .join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
