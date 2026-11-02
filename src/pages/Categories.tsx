import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { z } from "zod";
import { EmptyState, ErrorState, FieldError, Modal, PageTitle, Spinner } from "../components/ui";
import { useCategories } from "../hooks/useCategories";
import { api, getErrorMessage } from "../lib/api";
import type { Category } from "../lib/types";

const schema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(50) });
type FormValues = z.infer<typeof schema>;

export function Categories() {
  const { data, isLoading, isError, error, refetch } = useCategories();
  const queryClient = useQueryClient();
  // null = closed, "new" = create, Category = edit
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      refresh();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <>
      <PageTitle
        title="Categories"
        subtitle="Groups shown in the shop filter and on the home page"
        actions={
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} /> Add category
          </button>
        }
      />

      <section className="panel">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState title="No categories yet" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th className="num">Products</th>
                  <th className="actions-col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id}>
                    <td className="muted">#{c.id}</td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td className="num">
                      <Link to={`/products?category=${c.id}`}>{c.productCount ?? 0}</Link>
                    </td>
                    <td className="actions-col">
                      <button className="icon-btn" onClick={() => setEditing(c)} aria-label={`Rename ${c.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        aria-label={`Delete ${c.name}`}
                        disabled={remove.isPending}
                        onClick={() => {
                          if (confirm(`Delete the "${c.name}" category?`)) remove.mutate(c.id);
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
        )}
      </section>

      {editing && (
        <CategoryModal
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refresh();
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: category?.name ?? "" } });

  const save = useMutation({
    mutationFn: async (values: FormValues) =>
      category ? api.put(`/categories/${category.id}`, values) : api.post("/categories", values),
    onSuccess: () => {
      toast.success(category ? "Category renamed" : "Category added");
      onSaved();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal title={category ? "Rename category" : "Add category"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
        <label className="field">
          <span>Name</span>
          <input className="input" autoFocus placeholder="e.g. Shoes" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
