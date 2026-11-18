import { api } from "../../lib/api";
import type { Pagination, Product } from "../../lib/types";
import { cleanParams } from "../params";

export interface ProductListParams {
  search?: string;
  category?: number | string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductList {
  products: Product[];
  pagination: Pagination;
}

export interface ProductInput {
  name: string;
  categoryId: number | string;
  price: number;
  stock: number;
  description: string;
  size?: string;
  weight?: string;
  willow?: string;
  featured: boolean;
  image?: File | null;
}

function toFormData({ image, ...fields }: ProductInput) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value ?? ""));
  if (image) form.append("image", image);
  return form;
}

export async function getProducts(params: ProductListParams = {}) {
  return (await api.get<ProductList>("/products", { params: cleanParams(params) })).data;
}

export async function getProduct(id: number | string) {
  return (await api.get<{ product: Product }>(`/products/${id}`)).data.product;
}

export async function createProduct(input: ProductInput) {
  return (await api.post<{ product: Product }>("/products", toFormData(input))).data.product;
}

export async function updateProduct(id: number | string, input: ProductInput) {
  return (await api.put<{ product: Product }>(`/products/${id}`, toFormData(input))).data.product;
}

export async function deleteProduct(id: number) {
  return (await api.delete<{ message: string }>(`/products/${id}`)).data;
}
