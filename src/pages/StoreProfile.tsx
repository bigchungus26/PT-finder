import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin, Star, Clock, Phone, Instagram,
  Package, Search, Building2, ChevronRight, ShoppingBag,
} from 'lucide-react';
import { useStore, useStoreProducts, useCategories } from '@/hooks/useStores';
import { formatLBP, formatDeliveryTime } from '@/types/stackr';
import type { Product, SupplementCategory } from '@/types/stackr';

function ProductCard({ product }: { product: Product }) {
  const discount = product.original_price_lbp
    ? Math.round((1 - product.price_lbp / product.original_price_lbp) * 100)
    : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-8 h-8 text-muted-foreground/30" />
        )}
        {discount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-xs">
            -{discount}%
          </Badge>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Out of stock</Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        {product.brand && <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>}
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-1">{product.name}</p>
        <p className="font-bold text-primary text-sm">{formatLBP(product.price_lbp)}</p>
      </div>
    </Link>
  );
}

export default function StoreProfile() {
  const { storeId } = useParams<{ storeId: string }>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const { data: allProducts = [], isLoading: productsLoading } = useStoreProducts(storeId);

  const filtered = allProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === null || p.category_id === activeCategory;
    return matchSearch && matchCat;
  });

  // Build category list from products in this store
  const storeCategoryIds = [...new Set(allProducts.map((p) => p.category_id).filter(Boolean))];
  const storeCategories = allProducts
    .filter((p) => p.category_id && storeCategoryIds.includes(p.category_id))
    .map((p) => p.category as SupplementCategory | null)
    .filter((c): c is SupplementCategory => !!c)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  if (storeLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!store) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Store not found</h2>
          <Link to="/stores"><Button variant="outline">Browse Stores</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Banner + header */}
        <div className="relative">
          {store.banner_url ? (
            <img src={store.banner_url} alt="" className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="px-4 -mt-6 mb-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <div className="w-16 h-16 rounded-2xl border-4 border-background bg-card shadow-md flex items-center justify-center overflow-hidden">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="mb-1">
                <h1 className="font-display text-xl font-bold text-foreground">{store.name}</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {store.city}{store.address ? ` · ${store.address}` : ''}
                </div>
              </div>
            </div>
            {store.whatsapp && (
              <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>

          {store.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{store.description}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Star className="w-4 h-4 fill-current" />
              {store.rating_avg.toFixed(1)}
              <span className="text-muted-foreground font-normal">({store.total_reviews})</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatDeliveryTime(store.estimated_delivery_minutes)}
            </span>
            <span className="text-muted-foreground">
              {store.delivery_fee_lbp === 0 ? (
                <span className="text-green-600 font-medium">Free delivery</span>
              ) : (
                <>{formatLBP(store.delivery_fee_lbp)} delivery</>
              )}
            </span>
            {store.min_order_lbp > 0 && (
              <span className="text-muted-foreground text-xs">
                Min. {formatLBP(store.min_order_lbp)}
              </span>
            )}
          </div>

          {store.instagram && (
            <a
              href={`https://instagram.com/${store.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              {store.instagram}
            </a>
          )}
        </div>

        {/* Search + categories */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in this store..."
              className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
            />
          </div>
          {storeCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === null
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                All
              </button>
              {storeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="p-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? `No products matching "${search}"` : 'No products listed yet'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{filtered.length} products</p>
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((p) => <ProductCard key={p.id} product={p as Product} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
