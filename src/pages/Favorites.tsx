import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Heart, Package, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatLBP } from '@/types/stackr';
import type { Product, Store } from '@/types/stackr';
import { FavoriteButton } from '@/components/FavoriteButton';

export default function Favorites() {
  const { user } = useAuth();
  const { data: favs = [], isLoading } = useFavorites(user?.id);

  const productIds = favs.map((f) => f.product_id).filter((id): id is string => !!id);
  const storeIds = favs.map((f) => f.store_id).filter((id): id is string => !!id);

  const { data: products = [] } = useQuery({
    queryKey: ['fav-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(*), category:supplement_categories(*)')
        .in('id', productIds);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    enabled: productIds.length > 0,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['fav-stores', storeIds],
    queryFn: async () => {
      if (storeIds.length === 0) return [];
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .in('id', storeIds);
      if (error) throw error;
      return (data ?? []) as Store[];
    },
    enabled: storeIds.length > 0,
  });

  const isEmpty = !isLoading && products.length === 0 && stores.length === 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-8">
        <h1 className="font-display text-xl font-bold text-foreground">Favorites</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tap the heart on any product or store to save it here.
            </p>
            <Link to="/browse"><Button>Browse Supplements</Button></Link>
          </div>
        ) : (
          <>
            {stores.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Stores
                </h2>
                <div className="space-y-2">
                  {stores.map((store) => (
                    <Link
                      key={store.id}
                      to={`/stores/${store.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {store.logo_url
                          ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                          : <Building2 className="w-6 h-6 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{store.name}</p>
                        <p className="text-xs text-muted-foreground">{store.city}</p>
                      </div>
                      <FavoriteButton storeId={store.id} size="sm" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Products
                </h2>
                <div className="space-y-2">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          : <Package className="w-6 h-6 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                        <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-primary font-bold">{formatLBP(product.price_lbp)}</p>
                      </div>
                      <FavoriteButton productId={product.id} size="sm" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
