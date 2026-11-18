import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type AdminProduct = ProductRow & {
  categories: { name: string } | null;
  product_images: ProductImageRow[];
};

export const adminCategoriesQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*, products(count)")
      .order("sort_order")
      .order("name");
    if (error) throw error;
    return data.map((c) => ({
      ...c,
      productCount: (c.products as unknown as { count: number }[])[0]?.count ?? 0,
    }));
  },
});

export const adminProductsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), product_images(*)")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as AdminProduct[];
  },
});

export const adminProductQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), product_images(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AdminProduct | null;
    },
  });
