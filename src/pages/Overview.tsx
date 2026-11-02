import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Mail, Package, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductImage } from "../components/ProductImage";
import { SalesChart } from "../components/SalesChart";
import { EmptyState, ErrorState, PageTitle, Spinner, StatusBadge } from "../components/ui";
import { api, getErrorMessage } from "../lib/api";
import { formatDate, formatPrice, orderNumber, orderStatuses, statusLabel } from "../lib/format";
import type { Stats } from "../lib/types";

export function Overview() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await api.get<Stats>("/admin/stats")).data,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const { totals } = data;
  const weekTotal = data.salesByDay.reduce((s, d) => s + d.total, 0);
  const statusMax = Math.max(1, ...orderStatuses.map((s) => data.ordersByStatus[s] ?? 0));

  const tiles = [
    { label: "Revenue", value: formatPrice(totals.revenue), note: "All orders except cancelled", Icon: Banknote, to: "/orders" },
    { label: "Orders", value: totals.orders, note: `${totals.pendingOrders} waiting to be processed`, Icon: ShoppingBag, to: "/orders" },
    { label: "Products", value: totals.products, note: `${data.lowStock.length} low on stock`, Icon: Package, to: "/products" },
    { label: "Customers", value: totals.customers, note: "Registered accounts", Icon: Users, to: "/customers" },
    { label: "Unread messages", value: totals.unreadMessages, note: "From the contact form", Icon: Mail, to: "/messages" },
  ];

  return (
    <>
      <PageTitle title="Overview" subtitle="How the shop is doing today" />

      <div className="stat-grid">
        {tiles.map(({ label, value, note, Icon, to }) => (
          <Link key={label} to={to} className="stat-tile">
            <span className="stat-icon">
              <Icon size={20} />
            </span>
            <span className="stat-label">{label}</span>
            <strong className="stat-value">{value}</strong>
            <small>{note}</small>
          </Link>
        ))}
      </div>

      <div className="grid-2-1">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Sales, last 7 days</h2>
              <p className="muted small">Orders that were not cancelled</p>
            </div>
            <strong className="panel-figure">{formatPrice(weekTotal)}</strong>
          </div>
          <SalesChart days={data.salesByDay} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Orders by status</h2>
          </div>
          <ul className="status-bars">
            {orderStatuses.map((s) => {
              const n = data.ordersByStatus[s] ?? 0;
              return (
                <li key={s}>
                  <Link to={`/orders?status=${s}`}>
                    <span className="status-bars-label">{statusLabel[s]}</span>
                    <span className="status-bars-track">
                      {n > 0 && <span className={`status-bars-fill fill-${s.toLowerCase()}`} style={{ width: `${(n / statusMax) * 100}%` }} />}
                    </span>
                    <strong>{n}</strong>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid-2-1">
        <section className="panel">
          <div className="panel-head">
            <h2>Recent orders</h2>
            <Link to="/orders" className="small">
              View all
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/orders/${o.id}`}>
                          <strong>{orderNumber(o.id)}</strong>
                        </Link>
                      </td>
                      <td>{o.user.name}</td>
                      <td className="nowrap">{formatDate(o.orderDate)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="num nowrap">{formatPrice(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>
                <AlertTriangle size={18} className="text-warn" /> Low stock
              </h2>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="muted small">All products have enough stock.</p>
            ) : (
              <ul className="mini-list">
                {data.lowStock.map((p) => (
                  <li key={p.id}>
                    <ProductImage src={p.image} alt={p.name} className="thumb" />
                    <Link to={`/products/${p.id}/edit`}>{p.name}</Link>
                    <span className={p.stock === 0 ? "pill pill-danger" : "pill pill-warn"}>
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Best sellers</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="muted small">No sales yet.</p>
            ) : (
              <ul className="mini-list">
                {data.topProducts.map((p) => (
                  <li key={p.id}>
                    <ProductImage src={p.image ?? null} alt={p.name ?? ""} className="thumb" />
                    <span>{p.name}</span>
                    <strong className="small">{p.sold} sold</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
