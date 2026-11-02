import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ErrorState, FieldError, PageTitle, Spinner } from "../components/ui";
import { useCategories } from "../hooks/useCategories";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { api, getErrorMessage } from "../lib/api";
import { imageUrl } from "../lib/format";
import type { Product } from "../lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  categoryId: z.string().min(1, "Choose a category"),
  price: z.number({ error: "Enter a price" }).positive("Price must be more than 0"),
  stock: z.number({ error: "Enter the stock" }).int("Stock must be a whole number").min(0, "Stock cannot be negative"),
  description: z.string().trim().min(1, "Description is required").max(5000),
  size: z.string().trim().max(100).optional(),
  weight: z.string().trim().max(100).optional(),
  willow: z.string().trim().max(100).optional(),
  featured: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [image, setImage] = useState<File | null>(null);
  const preview = useObjectUrl(image);

  const existing = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get<{ product: Product }>(`/products/${id}`)).data.product,
    enabled: isEdit,
  });
  const product = existing.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", categoryId: "", description: "", size: "", weight: "", willow: "", featured: false },
    values: product
      ? {
          name: product.name,
          categoryId: String(product.categoryId),
          price: product.price,
          stock: product.stock,
          description: product.description,
          size: product.size ?? "",
          weight: product.weight ?? "",
          willow: product.willow ?? "",
          featured: product.featured,
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(values)) form.append(key, String(value ?? ""));
      if (image) form.append("image", image);
      const res = isEdit ? await api.put<{ product: Product }>(`/products/${id}`, form) : await api.post<{ product: Product }>("/products", form);
      return res.data.product;
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.setQueryData(["product", String(saved.id)], saved);
      navigate("/products");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isEdit && existing.isLoading) return <Spinner />;
  if (isEdit && existing.isError) return <ErrorState message={getErrorMessage(existing.error)} onRetry={() => existing.refetch()} />;

  const shownImage = preview ?? imageUrl(product?.image);

  return (
    <>
      <Link to="/products" className="back-link">
        <ArrowLeft size={16} /> Products
      </Link>
      <PageTitle title={isEdit ? "Edit product" : "Add product"} subtitle={product?.name} />

      <form className="product-form" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
        <section className="panel form">
          <h2>Details</h2>
          <label className="field">
            <span>Name</span>
            <input className="input" placeholder="e.g. Pro Edition English Willow Bat" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </label>
          <div className="form-row">
            <label className="field">
              <span>Category</span>
              <select className="input" {...register("categoryId")}>
                <option value="">Choose...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.categoryId?.message} />
            </label>
            <label className="field">
              <span>Price (Rs)</span>
              <input className="input" type="number" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
              <FieldError message={errors.price?.message} />
            </label>
            <label className="field">
              <span>Stock</span>
              <input className="input" type="number" step="1" min="0" {...register("stock", { valueAsNumber: true })} />
              <FieldError message={errors.stock?.message} />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea className="input" rows={5} placeholder="What the item is and who it is for" {...register("description")} />
            <FieldError message={errors.description?.message} />
          </label>
          <div className="form-row">
            <label className="field">
              <span>Size <em className="muted">(optional)</em></span>
              <input className="input" placeholder="e.g. Short handle" {...register("size")} />
            </label>
            <label className="field">
              <span>Weight <em className="muted">(optional)</em></span>
              <input className="input" placeholder="e.g. about 1.2 kg" {...register("weight")} />
            </label>
            <label className="field">
              <span>Willow <em className="muted">(optional)</em></span>
              <input className="input" placeholder="e.g. English willow" {...register("willow")} />
            </label>
          </div>
          <label className="checkbox">
            <input type="checkbox" {...register("featured")} />
            <span>
              <strong>Featured product</strong>
              <small className="muted">Show it on the home page</small>
            </span>
          </label>
        </section>

        <aside className="stack">
          <section className="panel">
            <h2>Image</h2>
            <label className="image-drop">
              {shownImage ? <img src={shownImage} alt="" /> : <ImagePlus size={36} />}
              <span>{image ? image.name : shownImage ? "Click to change image" : "Click to choose an image"}</span>
              <small className="muted">JPG, PNG, WEBP or GIF, up to 2 MB</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) toast.error("Image must be 2 MB or smaller");
                  else setImage(file);
                }}
              />
            </label>
          </section>
          <button className="btn btn-primary btn-block" disabled={save.isPending}>
            {save.isPending ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </button>
          <Link to="/products" className="btn btn-outline btn-block">
            Cancel
          </Link>
        </aside>
      </form>
    </>
  );
}
