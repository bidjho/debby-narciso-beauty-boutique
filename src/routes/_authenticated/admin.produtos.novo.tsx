import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produtos/novo")({
  component: () => (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="size-4" /> Produtos</Link>
      <h1 className="mb-6 mt-2 text-4xl font-semibold">Novo produto</h1>
      <ProductForm />
    </div>
  ),
});
