import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SearchBox } from "../components/SearchBox";
import { EmptyState, ErrorState, PageTitle, Pager, Spinner } from "../components/ui";
import { useListParams } from "../hooks/useListParams";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { Message, Pagination } from "../lib/types";

export function Messages() {
  const { params, search, page, searchText, setSearchText, set } = useListParams();
  const unread = params.get("unread") === "true";
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["messages", { search, unread, page }],
    queryFn: async () =>
      (
        await api.get<{ messages: Message[]; pagination: Pagination }>("/messages", {
          params: { search: search || undefined, unread: unread || undefined, page },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["messages"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const markRead = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => api.patch(`/messages/${id}/read`, { isRead }),
    onSuccess: refresh,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      toast.success("Message deleted");
      refresh();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggle = (m: Message) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.isRead) markRead.mutate({ id: m.id, isRead: true });
  };

  return (
    <>
      <PageTitle title="Messages" subtitle="Sent from the Contact page" />
      <div className="tabs">
        <button className={!unread ? "active" : ""} onClick={() => set("unread", "")}>
          All
        </button>
        <button className={unread ? "active" : ""} onClick={() => set("unread", "true")}>
          Unread
        </button>
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search messages..." />
        </div>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.messages.length ? (
          <EmptyState title={unread ? "No unread messages" : "No messages yet"} />
        ) : (
          <>
            <ul className="message-list">
              {data.messages.map((m) => (
                <li key={m.id} className={`${m.isRead ? "" : "unread"} ${openId === m.id ? "open" : ""}`}>
                  <button className="message-summary" onClick={() => toggle(m)} aria-expanded={openId === m.id}>
                    {m.isRead ? <MailOpen size={18} className="muted" /> : <Mail size={18} className="text-primary" />}
                    <span className="message-from">
                      <strong>{m.name}</strong>
                      <small className="muted">{m.email}</small>
                    </span>
                    <span className="message-preview">{m.message}</span>
                    <small className="muted nowrap">{formatDateTime(m.sentAt)}</small>
                  </button>
                  {openId === m.id && (
                    <div className="message-body">
                      <p>{m.message}</p>
                      <div className="message-actions">
                        <a className="btn btn-primary btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to BWS Sports")}`}>
                          <Reply size={16} /> Reply by email
                        </a>
                        <button className="btn btn-outline btn-sm" onClick={() => markRead.mutate({ id: m.id, isRead: false })}>
                          Mark as unread
                        </button>
                        <button
                          className="btn btn-outline btn-sm danger"
                          onClick={() => {
                            if (confirm("Delete this message?")) remove.mutate(m.id);
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Pager {...data.pagination} onChange={(p) => set("page", String(p))} />
          </>
        )}
      </section>
    </>
  );
}
