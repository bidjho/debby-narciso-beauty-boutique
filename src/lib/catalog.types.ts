export type PublicImage = { url: string; isPrimary: boolean };

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  promoActive: boolean;
  manageStock: boolean;
  stock: number | null;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  images: PublicImage[];
};

export type CatalogSort = "novidades" | "preco-asc" | "preco-desc";
