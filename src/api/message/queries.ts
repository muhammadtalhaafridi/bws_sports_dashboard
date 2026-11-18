import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cleanParams } from "../params";
import { getMessages, type MessageListParams } from "./fetcher";

export const messageKeys = {
  all: ["messages"] as const,
  list: (params: MessageListParams) => ["messages", cleanParams(params)] as const,
};

/** A page of contact messages. */
export function useMessages(params: MessageListParams = {}) {
  return useQuery({
    queryKey: messageKeys.list(params),
    queryFn: () => getMessages(params),
    placeholderData: keepPreviousData,
  });
}
