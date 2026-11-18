import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { adminProductQuery } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { data, isLoading, isError } = useQuery(adminProductQuery(id));
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="size-4" /> Produtos</Link>
      <h1 className="mb-6 mt-2 text-4xl font-semibold">Editar produto</h1>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-card" />
      ) : isError ? (
        <p className="rounded-2xl bg-card p-6 text-sm text-destructive">Não foi possível carregar o produto.</p>
      ) : !data ? (
        <p className="rounded-2xl bg-card p-6 text-sm">Produto não encontrado.</p>
      ) : (
        <ProductForm key={data.id + data.updated_at} product={data} />
      )}
    </div>
  );
}
