import { api } from "../../lib/api";
import type { Message, Pagination } from "../../lib/types";
import { cleanParams } from "../params";

export interface MessageListParams {
  search?: string;
  /** true shows only unread messages. */
  unread?: boolean;
  page?: number;
}

export async function getMessages({ unread, ...params }: MessageListParams = {}) {
  return (
    await api.get<{ messages: Message[]; pagination: Pagination }>("/messages", {
      params: cleanParams({ ...params, unread: unread || undefined }),
    })
  ).data;
}

export async function setMessageRead(id: number, isRead: boolean) {
  return (await api.patch<{ message: Message }>(`/messages/${id}/read`, { isRead })).data;
}

export async function deleteMessage(id: number) {
  return (await api.delete<{ message: string }>(`/messages/${id}`)).data;
}
