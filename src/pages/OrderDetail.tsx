import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, MapPin, Phone, Package, CheckCircle2,
  Truck, ChefHat, ShoppingBag, XCircle, Star, X,
} from 'lucide-react';
import { useOrder, useSubmitReview } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { formatLBP, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/stackr';
import type { OrderStatus } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <ShoppingBag className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  out_for_delivery: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

function DeliveryCountdown({ eta }: { eta: Date }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = eta.getTime() - Date.now();
      if (diff <= 0) { setRemaining('Any moment now!'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [eta]);

  return (
    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
      <Clock className="w-5 h-5 text-primary shrink-0 animate-pulse" />
      <div>
        <p className="text-sm font-semibold text-foreground">
          Arriving in <span className="text-primary text-base font-black">{remaining}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Est. {eta.toLocaleTimeString('en-LB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function ReviewModal({ orderId, storeId, onClose }: { orderId: string; storeId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const submitReview = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    await submitReview.mutateAsync({ storeId, userId: user.id, orderId, rating, comment });
    toast({ title: 'Review submitted! ⭐', description: 'Thank you for your feedback.' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-background rounded-t-3xl p-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Rate your order</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="transition-transform active:scale-90"
            >
              <Star
                className={`w-10 h-10 transition-colors ${(hovered || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : rating === 5 ? 'Excellent! 🎉' : 'Tap to rate'}
        </p>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)..."
          className="rounded-xl resize-none h-20 text-sm mb-4"
        />

        <Button
          className="w-full h-12"
          onClick={handleSubmit}
          disabled={rating === 0 || submitReview.isPending}
        >
          {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}

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
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : STATUS_ICONS[step]}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-0.5 ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
            <div className="pt-1.5 pb-6">
              <p className={`text-sm font-semibold ${future ? 'text-muted-foreground' : 'text-foreground'}`}>
                {ORDER_STATUS_LABELS[step]}
              </p>
              {active && <p className="text-xs text-primary mt-0.5">In progress...</p>}
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
  const [showReview, setShowReview] = useState(false);

  const isDelivered = order?.status === 'delivered';
  const isActive = order && ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
  const eta = order?.estimated_delivery_at ? new Date(order.estimated_delivery_at) : null;

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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {isDelivered ? 'Delivered!' : 'Order Tracking'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Badge className={`border ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Live countdown */}
        {eta && isActive && <DeliveryCountdown eta={eta} />}

        {/* Delivered — prompt for review */}
        {isDelivered && (
          <div className="rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Order delivered 🎉</p>
              <p className="text-xs text-green-600 dark:text-green-500">How was your experience?</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowReview(true)} className="shrink-0 border-green-300 text-green-700">
              <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
              Rate Order
            </Button>
          </div>
        )}

        {/* Tracking timeline */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Status</h2>
          <TrackingTimeline status={order.status} />
        </div>

        {/* Store */}
        {order.store && (
          <Link to={`/stores/${order.store_id}`}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {order.store.logo_url
                ? <img src={order.store.logo_url} alt="" className="w-full h-full object-cover" />
                : <Package className="w-5 h-5 text-muted-foreground" />}
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
                    {item.product_image
                      ? <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-muted-foreground/30" />}
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
          {order.notes && <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>}
        </div>

        <div className="text-center pt-2">
          <Link to="/orders" className="text-sm text-primary font-medium">View all orders</Link>
        </div>
      </div>

      {showReview && order.store_id && (
        <ReviewModal orderId={order.id} storeId={order.store_id} onClose={() => setShowReview(false)} />
      )}
    </AppLayout>
  );
}
