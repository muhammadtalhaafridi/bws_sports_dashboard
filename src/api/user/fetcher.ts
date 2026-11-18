import { api } from "../../lib/api";
import type { Customer, Pagination } from "../../lib/types";
import { cleanParams } from "../params";

export interface CustomerListParams {
  search?: string;
  page?: number;
}

export async function getCustomers(params: CustomerListParams = {}) {
  return (await api.get<{ users: Customer[]; pagination: Pagination }>("/admin/users", { params: cleanParams(params) })).data;
}
