import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Star, Clock, ChevronRight, Zap, Package, Building2, TrendingUp, History } from 'lucide-react';
import { useStores, useCategories, useFeaturedProducts, useTrendingProducts } from '@/hooks/useStores';
import { formatLBP, formatDeliveryTime } from '@/types/stackr';
import { getRecentlyViewed } from '@/lib/recentlyViewed';
import { FavoriteButton } from '@/components/FavoriteButton';
import type { Store, Product } from '@/types/stackr';

function StoreCard({ store }: { store: Store }) {
  return (
    <Link to={`/stores/${store.id}`}
      className="group flex-shrink-0 w-60 rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all relative">
      {store.banner_url
        ? <img src={store.banner_url} alt="" className="w-full h-24 object-cover" />
        : <div className="w-full h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary/40" />
          </div>}
      <div className="absolute top-2 right-2">
        <FavoriteButton storeId={store.id} size="sm" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {store.logo_url
            ? <img src={store.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
            : <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-primary" /></div>}
          <p className="font-semibold text-sm text-foreground truncate">{store.name}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <Star className="w-3 h-3 fill-current" />{store.rating_avg.toFixed(1)}
          </span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDeliveryTime(store.estimated_delivery_minutes)}</span>
          {store.delivery_fee_lbp === 0
            ? <span className="text-green-600 font-medium">Free</span>
            : <span>{formatLBP(store.delivery_fee_lbp)}</span>}
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product }: { product: Product }) {
  const discount = product.original_price_lbp
    ? Math.round((1 - product.price_lbp / product.original_price_lbp) * 100)
    : null;

  return (
    <Link to={`/products/${product.id}`}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all relative">
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <Package className="w-10 h-10 text-muted-foreground/40" />}
        {discount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-xs">-{discount}%</Badge>
        )}
        <div className="absolute top-2 right-2">
          <FavoriteButton productId={product.id} size="sm" />
        </div>
      </div>
      <div className="p-3">
        {product.brand && <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>}
        <p className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{product.name}</p>
        <p className="font-bold text-primary text-sm">{formatLBP(product.price_lbp)}</p>
        {product.store && <p className="text-xs text-muted-foreground mt-0.5">{product.store.name}</p>}
      </div>
    </Link>
  );
}

const CATEGORY_COLORS = [
  'from-purple-500/20 to-purple-500/5 border-purple-200 dark:border-purple-800',
  'from-blue-500/20 to-blue-500/5 border-blue-200 dark:border-blue-800',
  'from-orange-500/20 to-orange-500/5 border-orange-200 dark:border-orange-800',
  'from-green-500/20 to-green-500/5 border-green-200 dark:border-green-800',
  'from-red-500/20 to-red-500/5 border-red-200 dark:border-red-800',
  'from-yellow-500/20 to-yellow-500/5 border-yellow-200 dark:border-yellow-800',
  'from-pink-500/20 to-pink-500/5 border-pink-200 dark:border-pink-800',
  'from-indigo-500/20 to-indigo-500/5 border-indigo-200 dark:border-indigo-800',
  'from-teal-500/20 to-teal-500/5 border-teal-200 dark:border-teal-800',
  'from-cyan-500/20 to-cyan-500/5 border-cyan-200 dark:border-cyan-800',
];

export default function Home() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: categories = [] } = useCategories();
  const { data: featured = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { data: trending = [] } = useTrendingProducts();
  const recentlyViewed = getRecentlyViewed();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) navigate(`/browse?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Hero search */}
        <div className="px-4 pt-6 pb-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Lebanon's Supplement Store</p>
          <h1 className="font-display text-3xl font-black text-foreground leading-tight mb-4">
            Find any supplement,<br />delivered fast.
          </h1>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search supplements, brands..."
                className="pl-10 h-12 text-base rounded-xl bg-muted border-0 focus-visible:ring-1"
              />
              {searchInput && (
                <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-lg">
                  Search
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" /> Recently Viewed
              </h2>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-none">
              {recentlyViewed.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="flex-shrink-0 w-28 rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-6 h-6 text-muted-foreground/30" />}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{p.name}</p>
                    <p className="text-xs text-primary font-bold mt-0.5">{formatLBP(p.price_lbp)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Shop by Category</h2>
            <Link to="/browse" className="text-xs text-primary font-medium">See all</Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {categories.slice(0, 10).map((cat, i) => (
              <Link key={cat.id} to={`/browse?category=${cat.slug}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} hover:scale-105 transition-transform`}>
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stores */}
        <div className="mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Stores Near You
            </h2>
            <Link to="/stores" className="text-xs text-primary font-medium flex items-center gap-0.5">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {storesLoading ? (
            <div className="flex gap-3 px-4">
              {[1, 2].map((i) => <div key={i} className="flex-shrink-0 w-60 h-44 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-none">
              {stores.map((s) => <StoreCard key={s.id} store={s} />)}
            </div>
          )}
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <div className="px-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" /> Trending Now
              </h2>
              <Link to="/browse" className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {trending.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Featured deals */}
        {featured.length > 0 && (
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Featured Deals
              </h2>
              <Link to="/browse?featured=1" className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {featuredLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* Not found nudge */}
        <div className="mx-4 mb-8 rounded-2xl bg-muted p-5 text-center">
          <p className="font-semibold text-foreground mb-1">Can't find what you need?</p>
          <p className="text-sm text-muted-foreground mb-3">Tell us what you're looking for and we'll track it down.</p>
          <Link to="/request"><Button variant="outline" size="sm">Request a Product</Button></Link>
        </div>
      </div>
    </AppLayout>
  );
}
