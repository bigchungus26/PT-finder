import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Phone, User, Clock, ShoppingBag,
  ChevronDown, Package, Tag, CheckCircle2, X, Loader2,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStores';
import { usePlaceOrder } from '@/hooks/useOrders';
import { usePromoCode } from '@/hooks/usePromoCode';
import { formatLBP, formatDeliveryTime } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';

const BEIRUT_AREAS = [
  'Hamra', 'Ashrafieh', 'Verdun', 'Badaro', 'Gemmayzeh',
  'Mar Mikhael', 'Rawda', 'Raouche', 'Zarif', 'Sin el Fil',
  'Dbayeh', 'Jounieh', 'Jdeideh', 'Dekwaneh', 'Antelias', 'Other',
];

const SAVED_ADDRESSES = [
  { label: '🏠 Home', key: 'home' },
  { label: '💼 Work', key: 'work' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, storeId, totalLBP, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { data: store } = useStore(storeId ?? undefined);
  const placeOrder = usePlaceOrder();
  const { toast } = useToast();
  const promo = usePromoCode();

  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: (profile as { saved_phone?: string } | null)?.saved_phone ?? '',
    address: (profile as { saved_address?: string } | null)?.saved_address ?? '',
    city: (profile as { saved_city?: string } | null)?.saved_city ?? 'Hamra',
    notes: '',
  });
  const [promoInput, setPromoInput] = useState('');
  const [addressTab, setAddressTab] = useState<'home' | 'work' | 'new'>('new');

  const deliveryFee = store?.delivery_fee_lbp ?? 0;
  const subtotal = totalLBP;
  const discount = promo.getDiscount(subtotal);
  const grandTotal = subtotal + deliveryFee - discount;

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isValid = form.name.trim() && form.phone.trim() && form.address.trim();

  const handleApplyPromo = () => promo.validate(promoInput, subtotal, user?.id);

  const handleSubmit = async () => {
    if (!user || !storeId || items.length === 0 || !isValid) return;
    try {
      const order = await placeOrder.mutateAsync({
        user_id: user.id,
        store_id: storeId,
        total_lbp: grandTotal,
        delivery_fee_lbp: deliveryFee,
        delivery_name: form.name,
        delivery_phone: form.phone,
        delivery_address: form.address,
        delivery_city: form.city,
        notes: form.notes || undefined,
        estimated_delivery_minutes: store?.estimated_delivery_minutes ?? 45,
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          product_brand: i.product.brand,
          product_image: i.product.image_url,
          unit_price_lbp: i.product.price_lbp,
          quantity: i.quantity,
          flavor: i.flavor,
        })),
      });
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch {
      toast({ title: 'Order failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-32">
        <div className="p-4 space-y-4">
          <h1 className="font-display text-xl font-bold text-foreground">Checkout</h1>

          {/* Delivery details */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Details
            </h2>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3" /> Full Name
              </Label>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your name" className="rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> Phone Number
              </Label>
              <Input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+961 70 000 000" className="rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Area / City</Label>
              <div className="relative">
                <select
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className="w-full h-10 pl-3 pr-10 rounded-xl border border-input bg-background text-sm appearance-none"
                >
                  {BEIRUT_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> Street / Building
              </Label>
              <Input value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Street name, building, floor..." className="rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Delivery Notes (optional)</Label>
              <Textarea
                value={form.notes} onChange={(e) => setField('notes', e.target.value)}
                placeholder="Leave at the door, call on arrival..." className="rounded-xl resize-none h-16 text-sm"
              />
            </div>
          </div>

          {/* Promo code */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" /> Promo Code
            </h2>
            {promo.promo ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-green-700 dark:text-green-400 text-sm">{promo.promo.code}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {promo.promo.discountType === 'flat'
                      ? `${formatLBP(promo.promo.discountValue)} off`
                      : `${promo.promo.discountValue}% off`}
                    {' — '}saving {formatLBP(discount)}
                  </p>
                </div>
                <button onClick={promo.clear} className="text-green-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="rounded-xl flex-1 font-mono uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={!promoInput.trim() || promo.loading}
                  className="shrink-0"
                >
                  {promo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
            {promo.error && (
              <p className="text-xs text-destructive mt-2">{promo.error}</p>
            )}
            {!promo.promo && !promo.error && (
              <p className="text-xs text-muted-foreground mt-2">Try: STACK10 · GAINZ15 · NEWUSER</p>
            )}
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Order Summary
            </h2>
            <div className="space-y-2 mb-3">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.flavor}`} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.product.image_url
                      ? <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-foreground">{item.product.name}</p>
                    {item.flavor && <p className="text-xs text-muted-foreground">{item.flavor}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                    <p className="font-medium">{formatLBP(item.product.price_lbp * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatLBP(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-medium">Free</span> : formatLBP(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Promo ({promo.promo?.code})</span>
                  <span>-{formatLBP(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-border">
                <span>Total (Cash on Delivery)</span>
                <span>{formatLBP(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Estimated delivery */}
          {store && (
            <div className="flex items-center gap-3 bg-muted rounded-2xl p-4">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Estimated delivery: {formatDeliveryTime(store.estimated_delivery_minutes)}
                </p>
                <p className="text-xs text-muted-foreground">from {store.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+var(--sab,0px))]">
        <div className="max-w-2xl mx-auto">
          <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={!isValid || placeOrder.isPending}>
            {placeOrder.isPending ? 'Placing Order...' : `Place Order · ${formatLBP(grandTotal)}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">Cash on delivery · No card required</p>
        </div>
      </div>
    </AppLayout>
  );
}
