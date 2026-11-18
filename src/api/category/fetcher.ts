import { api } from "../../lib/api";
import type { Category } from "../../lib/types";

export interface CategoryInput {
  name: string;
  image?: File | null;
  /** On update: clear the current image without uploading a new one. */
  removeImage?: boolean;
}

function toFormData({ name, image, removeImage }: CategoryInput) {
  const form = new FormData();
  form.append("name", name);
  if (image) form.append("image", image);
  else if (removeImage) form.append("removeImage", "true");
  return form;
}

export async function getCategories() {
  return (await api.get<{ categories: Category[] }>("/categories")).data.categories;
}

export async function createCategory(input: CategoryInput) {
  return (await api.post<{ category: Category }>("/categories", toFormData(input))).data.category;
}

export async function updateCategory(id: number, input: CategoryInput) {
  return (await api.put<{ category: Category }>(`/categories/${id}`, toFormData(input))).data.category;
}

export async function deleteCategory(id: number) {
  return (await api.delete<{ message: string }>(`/categories/${id}`)).data;
}
