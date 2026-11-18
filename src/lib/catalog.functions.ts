import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient } from "./public-db.server";
import { storageImageUrl } from "./images";
import { effectivePrice, hasValidPromo } from "./pricing";
import { PAGE_SIZE } from "./store-config";
import type { PublicCategory, PublicProduct } from "./catalog.types";

const PRODUCT_SELECT =
  "id,name,slug,description,price,promo_price,promo_active,manage_stock,stock,is_featured,sort_order,created_at,category_id,categories(id,name,slug),product_images(storage_path,image_url,is_primary,sort_order)";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  promo_price: number | string | null;
  promo_active: boolean;
  manage_stock: boolean;
  stock: number | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  categories: { id: string; name: string; slug: string } | null;
  product_images: {
    storage_path: string | null;
    image_url: string | null;
    is_primary: boolean;
    sort_order: number;
  }[];
};

function mapProduct(r: Row): PublicProduct {
  const imgs = [...(r.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => ({ url: storageImageUrl(i.storage_path) ?? i.image_url ?? "", isPrimary: i.is_primary }))
    .filter((i) => i.url);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    price: Number(r.price),
    promoPrice: r.promo_price == null ? null : Number(r.promo_price),
    promoActive: r.promo_active,
    manageStock: r.manage_stock,
    stock: r.stock,
    isFeatured: r.is_featured,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    category: r.categories ?? null,
    images: imgs,
  };
}

function mapCategory(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
}): PublicCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: storageImageUrl(c.image_path) ?? c.image_url,
  };
}

async function fetchActiveProducts() {
  const db = createPublicClient();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Não foi possível carregar os produtos");
  return (data as unknown as Row[]).map(mapProduct);
}

async function fetchCategories() {
  const db = createPublicClient();
  const { data, error } = await db
    .from("categories")
    .select("id,name,slug,description,image_path,image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error("Não foi possível carregar as categorias");
  return data.map(mapCategory);
}

const byNewest = (a: PublicProduct, b: PublicProduct) => b.createdAt.localeCompare(a.createdAt);

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const [products, categories] = await Promise.all([fetchActiveProducts(), fetchCategories()]);
  return {
    categories,
    featured: products.filter((p) => p.isFeatured).slice(0, 8),
    newest: [...products].sort(byNewest).slice(0, 8),
    promos: products.filter(hasValidPromo).slice(0, 8),
    total: products.length,
  };
});

export const listCategories = createServerFn({ method: "GET" }).handler(() => fetchCategories());

const listInput = z.object({
  q: z.string().trim().max(100).optional(),
  categoria: z.string().trim().max(100).optional(),
  ordem: z.enum(["novidades", "preco-asc", "preco-desc"]).optional(),
  pagina: z.number().int().min(1).max(100).optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data }) => {
    const [all, categories] = await Promise.all([fetchActiveProducts(), fetchCategories()]);
    let items = all;
    if (data.categoria) items = items.filter((p) => p.category?.slug === data.categoria);
    if (data.q) {
      const needle = data.q
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      items = items.filter((p) =>
        p.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(needle),
      );
    }
    const ordem = data.ordem ?? "novidades";
    if (ordem === "novidades") items = [...items].sort(byNewest);
    if (ordem === "preco-asc") items = [...items].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (ordem === "preco-desc") items = [...items].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    const pagina = data.pagina ?? 1;
    return {
      categories,
      total: items.length,
      items: items.slice(0, pagina * PAGE_SIZE),
      hasMore: items.length > pagina * PAGE_SIZE,
    };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const db = createPublicClient();
    const { data: row, error } = await db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar o produto");
    if (!row) return { product: null, related: [] as PublicProduct[] };
    const product = mapProduct(row as unknown as Row);
    let related: PublicProduct[] = [];
    if (product.category) {
      const { data: rel } = await db
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .eq("category_id", product.category.id)
        .neq("id", product.id)
        .order("sort_order", { ascending: true })
        .limit(4);
      related = ((rel ?? []) as unknown as Row[]).map(mapProduct);
    }
    return { product, related };
  });

export const getProductsByIds = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return [] as PublicProduct[];
    const db = createPublicClient();
    const { data: rows, error } = await db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .in("id", data.ids);
    if (error) throw new Error("Não foi possível verificar o carrinho");
    return (rows as unknown as Row[]).map(mapProduct);
  });
