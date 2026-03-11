import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Clock, Building2, MapPin } from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import { formatLBP, formatDeliveryTime } from '@/types/stackr';
import type { Store } from '@/types/stackr';

function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      to={`/stores/${store.id}`}
      className="group flex gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-8 h-8 text-primary/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-foreground">{store.name}</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 mb-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          {store.city}{store.address ? ` · ${store.address}` : ''}
        </div>
        {store.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{store.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <Star className="w-3 h-3 fill-current" />
            {store.rating_avg.toFixed(1)}
            <span className="text-muted-foreground font-normal">({store.total_reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDeliveryTime(store.estimated_delivery_minutes)}
          </span>
          {store.delivery_fee_lbp === 0 ? (
            <Badge variant="secondary" className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950">
              Free delivery
            </Badge>
          ) : (
            <span className="text-muted-foreground">{formatLBP(store.delivery_fee_lbp)} delivery</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Stores() {
  const [search, setSearch] = useState('');
  const { data: stores = [], isLoading } = useStores();

  const filtered = stores.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Search */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores or city..."
              className="pl-10 h-11 rounded-xl bg-muted border-0"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-lg font-bold text-foreground">All Stores</h1>
            <span className="text-xs text-muted-foreground">{filtered.length} stores</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? `No stores matching "${search}"` : 'No stores available yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => <StoreCard key={s.id} store={s} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
