import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { z } from "zod";
import { createCategory, deleteCategory, updateCategory } from "../api/category/fetcher";
import { categoryKeys, useCategories } from "../api/category/queries";
import { productKeys } from "../api/product/queries";
import { EmptyState, ErrorState, FieldError, Modal, PageTitle, Spinner } from "../components/ui";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { getErrorMessage } from "../lib/api";
import { imageUrl } from "../lib/format";
import type { Category } from "../lib/types";

const schema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(50) });
type FormValues = z.infer<typeof schema>;

export function Categories() {
  const { data, isLoading, isError, error, refetch } = useCategories();
  const queryClient = useQueryClient();
  // null = closed, "new" = create, Category = edit
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    queryClient.invalidateQueries({ queryKey: productKeys.all });
  };

  const remove = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.id),
    onSuccess: async (_res, category) => {
      // Reload the list on screen first, so the toast appears once the row is gone.
      await queryClient.refetchQueries({ queryKey: categoryKeys.all, type: "active" });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success(`"${category.name}" category deleted`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <>
      <PageTitle
        title="Categories"
        subtitle="Groups shown in the shop filter and, with their image, on the home page"
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
                  <th>Image</th>
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
                      {c.image ? (
                        <img src={imageUrl(c.image)} alt={c.name} className="thumb category-thumb" loading="lazy" />
                      ) : (
                        <span className="muted small">No image</span>
                      )}
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td className="num">
                      <Link to={`/products?category=${c.id}`}>{c.productCount ?? 0}</Link>
                    </td>
                    <td className="actions-col">
                      <button className="icon-btn" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        aria-label={`Delete ${c.name}`}
                        disabled={remove.isPending && remove.variables?.id === c.id}
                        onClick={() => remove.mutate(c)}
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
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const preview = useObjectUrl(image);
  const currentImage = removeImage ? undefined : imageUrl(category?.image);
  const shownImage = preview ?? currentImage;

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      category ? updateCategory(category.id, { ...values, image, removeImage }) : createCategory({ ...values, image }),
    onSuccess: () => {
      toast.success(category ? "Category updated" : "Category added");
      onSaved();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal title={category ? "Edit category" : "Add category"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
        <label className="field">
          <span>Name</span>
          <input className="input" autoFocus placeholder="e.g. Shoes" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </label>
        <div className="field">
          <span>Image</span>
          <label className="image-drop category-drop">
            {shownImage ? <img src={shownImage} alt="" /> : <ImagePlus size={36} />}
            <span>{image ? image.name : shownImage ? "Click to change image" : "Click to choose an image"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) toast.error("Image must be 2 MB or smaller");
                else {
                  setImage(file);
                  setRemoveImage(false);
                }
                e.target.value = "";
              }}
            />
          </label>
          {(image || currentImage) && (
            <button
              type="button"
              className="btn-link danger small"
              onClick={() => {
                if (image) setImage(null);
                else setRemoveImage(true);
              }}
            >
              {image ? "Cancel new image" : "Remove image"}
            </button>
          )}
          <span className="muted small">Optional. JPG, PNG, WEBP or GIF up to 2 MB; a wide (4:3) picture looks best.</span>
        </div>
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
