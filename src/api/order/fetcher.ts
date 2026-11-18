import { api } from "../../lib/api";
import type { AdminOrderRow, Order, OrderStatus, Pagination } from "../../lib/types";
import { cleanParams } from "../params";

export interface OrderListParams {
  search?: string;
  status?: OrderStatus | "";
  page?: number;
}

export async function getOrders(params: OrderListParams = {}) {
  return (await api.get<{ orders: AdminOrderRow[]; pagination: Pagination }>("/orders", { params: cleanParams(params) })).data;
}

export async function getOrder(id: number | string) {
  return (await api.get<{ order: Order }>(`/orders/${id}`)).data.order;
}

export async function updateOrderStatus(id: number | string, status: OrderStatus) {
  return (await api.patch<{ order: Order }>(`/orders/${id}/status`, { status })).data.order;
}
