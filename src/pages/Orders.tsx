import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { formatLBP, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/stackr';
import type { Order } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';

function ReorderButton({ order }: { order: Order }) {
  const { addItem, clearCart } = useCart();
  const { toast } = useToast();

  const handleReorder = async () => {
    if (!order.items || order.items.length === 0) return;
    if (!window.confirm('Add all items from this order to your cart?')) return;

    // Fetch live product data for items that still exist in the DB
    const productIds = order.items.map((i) => i.product_id).filter((id): id is string => !!id);
    const { data: liveProducts } = productIds.length > 0
      ? await supabase.from('products').select('*').in('id', productIds)
      : { data: [] };

    const productMap = new Map((liveProducts ?? []).map((p) => [p.id, p]));

    clearCart();

    for (const item of order.items) {
      const liveProduct = item.product_id ? productMap.get(item.product_id) : null;

      // Use live product data if available, fall back to order snapshot
      const productForCart = liveProduct ?? {
        id: item.product_id ?? `snapshot-${item.id}`,
        store_id: order.store_id,
        category_id: null,
        name: item.product_name,
        brand: item.product_brand,
        description: null,
        image_url: item.product_image,
        price_lbp: item.unit_price_lbp,
        original_price_lbp: null,
        weight_g: null,
        servings: null,
        flavor: null,
        flavors: item.flavor ? [item.flavor] : [],
        in_stock: true,
        is_featured: false,
        tags: [],
        created_at: '',
        view_count: 0,
      };

      addItem(productForCart, item.quantity, item.flavor);
    }

    toast({ title: 'Items added to cart!', description: 'Review your cart before checkout.' });
  };

  if (!order.items?.length) return null;

  return (
    <button
      onClick={handleReorder}
      className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
    >
      <RefreshCw className="w-3 h-3" />
      Reorder
    </button>
  );
}

function OrderCard({ order }: { order: Order }) {
  const createdAt = new Date(order.created_at);
  const itemCount = order.items?.length ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
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

      {order.items && order.items.length > 0 && (
        <div className="flex gap-2 mb-3">
          {order.items.slice(0, 4).map((item) => (
            <div key={item.id} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {item.product_image
                ? <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                : <Package className="w-5 h-5 text-muted-foreground/30" />}
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
        <div className="flex items-center gap-3">
          <ReorderButton order={order} />
          <Link to={`/orders/${order.id}`} className="flex items-center gap-1 text-xs text-muted-foreground">
            {['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status) && (
              <><Clock className="w-3 h-3 text-primary" /> <span className="text-primary">Track</span></>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
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
            {[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your supplement orders will appear here once you place one.
            </p>
            <Link to="/browse"><Button>Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
