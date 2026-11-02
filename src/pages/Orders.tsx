import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { SearchBox } from "../components/SearchBox";
import { EmptyState, ErrorState, PageTitle, Pager, Spinner, StatusBadge } from "../components/ui";
import { useListParams } from "../hooks/useListParams";
import { api, getErrorMessage } from "../lib/api";
import { formatDateTime, formatPrice, orderNumber, orderStatuses, statusLabel } from "../lib/format";
import type { AdminOrderRow, Pagination } from "../lib/types";

export function Orders() {
  const { params, search, page, searchText, setSearchText, set } = useListParams();
  const status = params.get("status") ?? "";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", { search, status, page }],
    queryFn: async () =>
      (
        await api.get<{ orders: AdminOrderRow[]; pagination: Pagination }>("/orders", {
          params: { search: search || undefined, status: status || undefined, page },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageTitle title="Orders" subtitle="Check new orders and update their status" />

      <div className="tabs" role="tablist">
        {["", ...orderStatuses].map((s) => (
          <button key={s || "all"} role="tab" aria-selected={status === s} className={status === s ? "active" : ""} onClick={() => set("status", s)}>
            {s ? statusLabel[s as keyof typeof statusLabel] : "All"}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="toolbar">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search by order no., name, email or phone..." />
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.orders.length ? (
          <EmptyState title="No orders found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="num">Items</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o.id} className="row-link">
                      <td>
                        <Link to={`/orders/${o.id}`}>
                          <strong>{orderNumber(o.id)}</strong>
                        </Link>
                      </td>
                      <td>
                        <div className="cell-stack">
                          <span>{o.user.name}</span>
                          <small className="muted">{o.user.email}</small>
                        </div>
                      </td>
                      <td className="nowrap">{formatDateTime(o.orderDate)}</td>
                      <td className="num">{o._count.items}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="num nowrap">
                        <strong>{formatPrice(o.total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...data.pagination} onChange={(p) => set("page", String(p))} />
          </>
        )}
      </section>
    </>
  );
}
