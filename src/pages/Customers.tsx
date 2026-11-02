import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { SearchBox } from "../components/SearchBox";
import { EmptyState, ErrorState, PageTitle, Pager, Spinner } from "../components/ui";
import { useListParams } from "../hooks/useListParams";
import { api, getErrorMessage } from "../lib/api";
import { formatDate, imageUrl } from "../lib/format";
import type { Customer, Pagination } from "../lib/types";

export function Customers() {
  const { search, page, searchText, setSearchText, set } = useListParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", { search, page }],
    queryFn: async () =>
      (await api.get<{ users: Customer[]; pagination: Pagination }>("/admin/users", { params: { search: search || undefined, page } })).data,
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageTitle title="Customers" subtitle="Everyone who has an account" />
      <section className="panel">
        <div className="toolbar">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search by name, email or phone..." />
        </div>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.users.length ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th className="num">Orders</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-product">
                          {u.image ? (
                            <img src={imageUrl(u.image)} alt="" className="avatar" />
                          ) : (
                            <span className="avatar avatar-letter">{u.name.charAt(0).toUpperCase()}</span>
                          )}
                          <div>
                            <strong>
                              {u.name} {u.role === "ADMIN" && <span className="pill pill-dark">Admin</span>}
                            </strong>
                            <small className="muted">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">{u.phone}</td>
                      <td className="cell-clip">{u.address ?? <span className="muted">—</span>}</td>
                      <td className="num">
                        {u.orderCount > 0 ? <Link to={`/orders?search=${encodeURIComponent(u.email)}`}>{u.orderCount}</Link> : 0}
                      </td>
                      <td className="nowrap">{formatDate(u.createdAt)}</td>
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
