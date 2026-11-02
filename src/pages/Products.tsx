import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { SearchBox } from "../components/SearchBox";
import { EmptyState, ErrorState, PageTitle, Pager, Spinner } from "../components/ui";
import { useCategories } from "../hooks/useCategories";
import { useListParams } from "../hooks/useListParams";
import { api, getErrorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import type { Pagination, Product } from "../lib/types";

export function Products() {
  const { params, search, page, searchText, setSearchText, set } = useListParams();
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", { search, category, sort, page }],
    queryFn: async () =>
      (
        await api.get<{ products: Product[]; pagination: Pagination }>("/products", {
          params: { search: search || undefined, category: category || undefined, sort, page, limit: 15 },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <>
      <PageTitle
        title="Products"
        subtitle="Add, edit and remove products in the shop"
        actions={
          <Link to="/products/new" className="btn btn-primary">
            <Plus size={18} /> Add product
          </Link>
        }
      />

      <section className="panel">
        <div className="toolbar">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search products..." />
          <select className="input select" value={category} onChange={(e) => set("category", e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="input select" value={sort} onChange={(e) => set("sort", e.target.value)} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.products.length ? (
          <EmptyState
            title="No products found"
            action={
              <Link to="/products/new" className="btn btn-primary btn-sm">
                Add product
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="num">Price</th>
                    <th className="num">Stock</th>
                    <th className="center">Featured</th>
                    <th className="actions-col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-product">
                          <ProductImage src={p.image} alt={p.name} className="thumb" />
                          <div>
                            <Link to={`/products/${p.id}/edit`}>
                              <strong>{p.name}</strong>
                            </Link>
                            <small className="muted">{[p.size, p.weight].filter(Boolean).join(" · ") || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.category.name}</td>
                      <td className="num nowrap">{formatPrice(p.price)}</td>
                      <td className="num">
                        <span className={p.stock === 0 ? "pill pill-danger" : p.stock <= 5 ? "pill pill-warn" : "pill"}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="center">
                        {p.featured ? <Star size={16} className="star" aria-label="Featured" /> : <span className="muted">—</span>}
                      </td>
                      <td className="actions-col">
                        <Link to={`/products/${p.id}/edit`} className="icon-btn" aria-label={`Edit ${p.name}`}>
                          <Pencil size={16} />
                        </Link>
                        <button
                          className="icon-btn danger"
                          aria-label={`Delete ${p.name}`}
                          disabled={remove.isPending}
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"? This cannot be undone.`)) remove.mutate(p.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...data.pagination} onChange={(p) => set("page", String(p))} />
          </>
        )}
      </section>
    </>
  );
}
