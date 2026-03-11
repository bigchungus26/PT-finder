import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package, Star, Clock, Minus, Plus, ShoppingBag,
  Building2, ChevronRight, Shield, Zap,
} from 'lucide-react';
import { useProduct } from '@/hooks/useStores';
import { useCart } from '@/contexts/CartContext';
import { formatLBP, formatDeliveryTime } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem, storeId: cartStoreId } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useProduct(productId);
  const [qty, setQty] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);

  const handleAddToCart = () => {
    if (!product) return;

    // Warn if cart has items from another store
    if (cartStoreId && cartStoreId !== product.store_id) {
      if (!window.confirm('Your cart has items from another store. Adding this will clear your cart. Continue?')) return;
    }

    addItem(product, qty, selectedFlavor);
    toast({
      title: 'Added to cart',
      description: `${product.name} × ${qty}`,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <Link to="/browse"><Button variant="outline">Browse Products</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const discount = product.original_price_lbp
    ? Math.round((1 - product.price_lbp / product.original_price_lbp) * 100)
    : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-32">
        {/* Product image */}
        <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-4" />
          ) : (
            <Package className="w-20 h-20 text-muted-foreground/20" />
          )}
          {discount && (
            <Badge className="absolute top-4 left-4 bg-red-500 text-white border-0">
              -{discount}% OFF
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Title + price */}
          <div>
            {product.brand && (
              <p className="text-sm font-semibold text-primary mb-1">{product.brand}</p>
            )}
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight mb-2">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-foreground">{formatLBP(product.price_lbp)}</span>
              {product.original_price_lbp && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatLBP(product.original_price_lbp)}
                </span>
              )}
            </div>
            {!product.in_stock && (
              <Badge variant="secondary" className="mt-2">Out of stock</Badge>
            )}
          </div>

          {/* Store info */}
          {product.store && (
            <Link
              to={`/stores/${product.store_id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {product.store.logo_url ? (
                  <img src={product.store.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{product.store.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDeliveryTime(product.store.estimated_delivery_minutes)}
                  </span>
                  <span>
                    {product.store.delivery_fee_lbp === 0
                      ? <span className="text-green-600 font-medium">Free delivery</span>
                      : <>{formatLBP(product.store.delivery_fee_lbp)} delivery</>}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}

          {/* Specs */}
          {(product.weight_g || product.servings) && (
            <div className="flex gap-3">
              {product.weight_g && (
                <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Weight</p>
                  <p className="font-bold text-foreground">{product.weight_g}g</p>
                </div>
              )}
              {product.servings && (
                <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Servings</p>
                  <p className="font-bold text-foreground">{product.servings}</p>
                </div>
              )}
              {product.weight_g && product.servings && (
                <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Per Serving</p>
                  <p className="font-bold text-foreground">{Math.round(product.weight_g / product.servings)}g</p>
                </div>
              )}
            </div>
          )}

          {/* Flavors */}
          {product.flavors && product.flavors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Flavor
                {selectedFlavor && <span className="text-primary font-normal ml-2">— {selectedFlavor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.flavors.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFlavor(selectedFlavor === f ? null : f)}
                    className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                      selectedFlavor === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">About this product</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Trust badges */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500 shrink-0" />
              Authentic products
            </div>
            <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
              Fast delivery
            </div>
          </div>
        </div>
      </div>

      {/* Sticky add to cart */}
      {product.in_stock && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t border-border p-4 pb-[calc(1rem+var(--sab,0px))]">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Qty selector */}
            <div className="flex items-center gap-2 rounded-xl border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={handleAddToCart} className="flex-1 h-12 text-base gap-2">
              <ShoppingBag className="w-5 h-5" />
              Add to cart · {formatLBP(product.price_lbp * qty)}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
