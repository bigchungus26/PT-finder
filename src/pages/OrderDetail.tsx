import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, MapPin, Phone, Package, CheckCircle2,
  Circle, Truck, ChefHat, ShoppingBag, XCircle,
} from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { formatLBP, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/stackr';
import type { OrderStatus } from '@/types/stackr';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <ShoppingBag className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  out_for_delivery: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

function TrackingTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
        <XCircle className="w-5 h-5 text-red-500" />
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const future = idx > currentIdx;

        return (
          <div key={step} className="flex items-start gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : STATUS_ICONS[step]}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-0.5 ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
            {/* Label */}
            <div className="pt-1.5 pb-6">
              <p className={`text-sm font-semibold ${future ? 'text-muted-foreground' : 'text-foreground'}`}>
                {ORDER_STATUS_LABELS[step]}
              </p>
              {active && (
                <p className="text-xs text-primary mt-0.5">In progress...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Link to="/orders"><Button variant="outline">My Orders</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const isDelivered = order.status === 'delivered';
  const eta = order.estimated_delivery_at
    ? new Date(order.estimated_delivery_at)
    : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {isDelivered ? 'Order Delivered!' : 'Order Tracking'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge className={`border ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* ETA */}
        {eta && !isDelivered && order.status !== 'cancelled' && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Estimated arrival: {eta.toLocaleTimeString('en-LB', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {eta.toLocaleDateString('en-LB', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Tracking timeline */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Status</h2>
          <TrackingTimeline status={order.status} />
        </div>

        {/* Store */}
        {order.store && (
          <Link
            to={`/stores/${order.store_id}`}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {order.store.logo_url ? (
                <img src={order.store.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{order.store.name}</p>
              <p className="text-xs text-muted-foreground">{order.store.city}</p>
            </div>
          </Link>
        )}

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-3">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                    {item.product_brand && <p className="text-xs text-muted-foreground">{item.product_brand}</p>}
                    {item.flavor && <p className="text-xs text-muted-foreground">{item.flavor}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    <p className="text-sm font-semibold text-foreground">{formatLBP(item.unit_price_lbp * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatLBP(order.total_lbp - order.delivery_fee_lbp)}</span>
              </div>
              {order.delivery_fee_lbp > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatLBP(order.delivery_fee_lbp)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total (Cash)</span>
                <span>{formatLBP(order.total_lbp)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Delivery Address
          </h2>
          <p className="text-sm text-foreground">{order.delivery_name}</p>
          <p className="text-sm text-muted-foreground">{order.delivery_address}, {order.delivery_city}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {order.delivery_phone}
          </p>
          {order.notes && (
            <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>
          )}
        </div>

        <div className="text-center pt-2">
          <Link to="/orders" className="text-sm text-primary font-medium">View all orders</Link>
        </div>
      </div>
    </AppLayout>
  );
}
