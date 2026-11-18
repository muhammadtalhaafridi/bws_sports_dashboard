import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { updateOrderStatus } from "../api/order/fetcher";
import { orderKeys, useOrder } from "../api/order/queries";
import { productKeys } from "../api/product/queries";
import { statsKeys } from "../api/stats/queries";
import { ProductImage } from "../components/ProductImage";
import { ErrorState, PageTitle, Spinner, StatusBadge } from "../components/ui";
import { getErrorMessage } from "../lib/api";
import { formatDateTime, formatPrice, orderNumber, orderStatuses, statusLabel, paymentSummary } from "../lib/format";
import type { OrderStatus } from "../lib/types";

export function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError, error, refetch } = useOrder(id);

  const update = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(orderKeys.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success(`Order marked as ${statusLabel[updated.status].toLowerCase()}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <Spinner />;
  if (isError || !order) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const cancelled = order.status === "CANCELLED";
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const onChange = (status: OrderStatus) => {
    if (status === "CANCELLED" && !confirm("Cancel this order? Its items will go back into stock. This cannot be undone.")) return;
    update.mutate(status);
  };

  return (
    <>
      <Link to="/orders" className="back-link">
        <ArrowLeft size={16} /> Orders
      </Link>
      <PageTitle
        title={`Order ${orderNumber(order.id)}`}
        subtitle={`Placed on ${formatDateTime(order.orderDate)}`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid-2-1">
        <section className="panel">
          <div className="panel-head">
            <h2>Items ({itemCount})</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Qty</th>
                  <th className="num">Price</th>
                  <th className="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="cell-product">
                        <ProductImage src={item.product.image} alt={item.product.name} className="thumb" />
                        <div>
                          <Link to={`/products/${item.product.id}/edit`}>
                            <strong>{item.product.name}</strong>
                          </Link>
                          <small className="muted">{item.product.category.name}</small>
                        </div>
                      </div>
                    </td>
                    <td className="num">{item.quantity}</td>
                    <td className="num nowrap">{formatPrice(item.price)}</td>
                    <td className="num nowrap">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="num">
                    <strong>Total</strong>
                  </td>
                  <td className="num nowrap">
                    <strong className="total">{formatPrice(order.total)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {order.description && (
            <div className="note">
              <strong>Customer note</strong>
              <p>{order.description}</p>
            </div>
          )}
        </section>

        <div className="stack">
          <section className="panel">
            <h2>Update status</h2>
            {cancelled ? (
              <p className="muted small">This order was cancelled and can no longer be changed.</p>
            ) : (
              <div className="status-picker">
                {orderStatuses.map((s) => (
                  <button
                    key={s}
                    className={`status-option ${order.status === s ? "current" : ""} ${s === "CANCELLED" ? "danger" : ""}`}
                    disabled={update.isPending || order.status === s}
                    onClick={() => onChange(s)}
                  >
                    {statusLabel[s]}
                    {order.status === s && <small>current</small>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Customer</h2>
            <ul className="info-list">
              <li>
                <strong>{order.user.name}</strong>
              </li>
              <li>
                <Mail size={16} /> <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </li>
              <li>
                <Phone size={16} /> <a href={`tel:${order.phone}`}>{order.phone}</a>
              </li>
              <li>
                <MapPin size={16} /> <span>{order.address}</span>
              </li>
            </ul>
            <p className="muted small">
              Payment: {paymentSummary(order)} · {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
              {order.cardholderName && <> · {order.cardholderName}</>}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
