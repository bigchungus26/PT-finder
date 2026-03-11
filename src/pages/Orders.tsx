import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, ChevronRight, Clock } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { formatLBP, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/stackr';
import type { Order } from '@/types/stackr';

function OrderCard({ order }: { order: Order }) {
  const createdAt = new Date(order.created_at);
  const itemCount = order.items?.length ?? 0;

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-foreground">{order.store?.name ?? 'Store'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {createdAt.toLocaleDateString('en-LB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}
            {createdAt.toLocaleTimeString('en-LB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <Badge className={`border text-xs shrink-0 ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {/* Item thumbnails */}
      {order.items && order.items.length > 0 && (
        <div className="flex gap-2 mb-3">
          {order.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden"
            >
              {item.product_image ? (
                <img src={item.product_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{order.items.length - 4}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''} · </span>
          <span className="font-semibold text-foreground">{formatLBP(order.total_lbp)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          {['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status) && (
            <>
              <Clock className="w-3 h-3" />
              Track order
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrders(user?.id);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="font-display text-xl font-bold text-foreground mb-4">My Orders</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your supplement orders will appear here once you place one.
            </p>
            <Link to="/browse">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
