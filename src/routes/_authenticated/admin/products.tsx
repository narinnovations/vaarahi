import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const { data: products, isLoading } = useQuery({

    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug,name")
        .order("sort_order");

      if (error) throw error;

      return data ?? [];
    },
  });

  const filteredProducts =
    products?.filter((p) => {
      const value = search.toLowerCase();

      const matchesSearch =
        p.name.toLowerCase().includes(value) ||
        p.slug.toLowerCase().includes(value) ||
        p.category_slug.toLowerCase().includes(value);

      const matchesCategory =
        categoryFilter === "all" ||
        p.category_slug === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "instock" && p.stock > 0) ||
        (stockFilter === "lowstock" && p.stock > 0 && p.stock < 5) ||
        (stockFilter === "outofstock" && p.stock === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    }) ?? [];

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Product deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  if (pathname !== "/admin/products") {
    return <Outlet />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">Products</h1>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search by name, slug or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-10 text-sm outline-none transition focus:border-primary"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>

            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Stock</option>
            <option value="instock">In Stock</option>
            <option value="lowstock">Low Stock (&lt;5)</option>
            <option value="outofstock">Out of Stock</option>
          </select>
          <Link
            to="/admin/products/new"
            className="bg-rose-gradient text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm shadow-luxe"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b bg-blush/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  No products found.
                </td>
              </tr>
            )}

            {filteredProducts.map((p) => (
              <tr
                key={p.id}
                className="border-b last:border-0 hover:bg-blush/20"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImage(p.images?.[0])}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />

                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.slug}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="p-4 capitalize">{p.category_slug}</td>

                <td className="p-4 text-right">
                  <div className="font-medium">
                    {formatINR(Number(p.price))}
                  </div>

                  {p.original_price && (
                    <div className="text-xs text-muted-foreground line-through">
                      {formatINR(Number(p.original_price))}
                    </div>
                  )}
                </td>

                <td className="p-4 text-right">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.stock === 0
                      ? "bg-ruby/10 text-ruby"
                      : p.stock < 5
                        ? "bg-champagne/40 text-charcoal"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    {p.stock}
                  </span>
                </td>

                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <Link
                      to="/admin/products/$id"
                      params={{ id: p.id }}
                      className="rounded-lg p-2 hover:bg-blush"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => remove(p.id, p.name)}
                      className="rounded-lg p-2 text-ruby hover:bg-ruby/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}