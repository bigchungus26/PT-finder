import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Minus, Plus, Trash2, Package, ArrowRight, Store, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatLBP } from '@/types/stackr';
import { useStore } from '@/hooks/useStores';

function DeliveryProgressBar({ subtotal, storeId }: { subtotal: number; storeId: string }) {
  const { data: store } = useStore(storeId);
  if (!store || store.delivery_fee_lbp === 0 || !store.free_delivery_above_lbp) return null;

  const threshold = store.free_delivery_above_lbp;
  const pct = Math.min(100, (subtotal / threshold) * 100);
  const remaining = threshold - subtotal;

  return (
    <div className="rounded-xl bg-muted p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-4 h-4 text-primary shrink-0" />
        {remaining > 0 ? (
          <p className="text-xs text-foreground">
            Add <span className="font-bold text-primary">{formatLBP(remaining)}</span> more for free delivery
          </p>
        ) : (
          <p className="text-xs font-bold text-green-600">🎉 You qualify for free delivery!</p>
        )}
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StoreDeliveryInfo({ storeId }: { storeId: string }) {
  const { data: store } = useStore(storeId);
  if (!store) return null;
  return (
    <div className="flex items-center justify-between text-sm py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">From <span className="text-foreground font-medium">{store.name}</span></span>
      </div>
      {store.min_order_lbp > 0 && (
        <span className="text-xs text-muted-foreground">Min. {formatLBP(store.min_order_lbp)}</span>
      )}
    </div>
  );
}

export default function Cart() {
  const { items, storeId, removeItem, updateQty, clearCart, totalLBP, itemCount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add supplements from any store to get started.</p>
          <Link to="/browse"><Button>Browse Supplements</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-32">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl font-bold text-foreground">
              Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h1>
            <button
              onClick={() => { if (window.confirm('Clear your cart?')) clearCart(); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          </div>

          {storeId && <StoreDeliveryInfo storeId={storeId} />}

          {/* Free delivery progress */}
          {storeId && (
            <div className="mt-3">
              <DeliveryProgressBar subtotal={totalLBP} storeId={storeId} />
            </div>
          )}

          {/* Items */}
          <div className="space-y-3 mt-1">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.flavor}`}
                className="flex gap-3 p-3 rounded-2xl border border-border bg-card">
                <Link to={`/products/${item.product.id}`}
                  className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {item.product.image_url
                    ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                    : <Package className="w-6 h-6 text-muted-foreground/30" />}
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.product.name}</p>
                  {item.product.brand && <p className="text-xs text-muted-foreground">{item.product.brand}</p>}
                  {item.flavor && <Badge variant="secondary" className="text-xs mt-0.5">{item.flavor}</Badge>}
                  <p className="font-bold text-primary text-sm mt-1">
                    {formatLBP(item.product.price_lbp * item.quantity)}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 border border-border rounded-xl">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 space-y-2">
            <h2 className="font-semibold text-foreground mb-3">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatLBP(totalLBP)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="text-muted-foreground text-xs">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatLBP(totalLBP)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Have a promo code? Apply it at checkout.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+var(--sab,0px))]">
        <div className="max-w-2xl mx-auto">
          <Button className="w-full h-12 text-base gap-2" onClick={() => navigate('/checkout')}>
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
