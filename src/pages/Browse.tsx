import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useProducts, useCategories, useSubmitProductRequest } from '@/hooks/useStores';
import { useAuth } from '@/contexts/AuthContext';
import { formatLBP } from '@/types/stackr';
import type { Product } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';
import { FavoriteButton } from '@/components/FavoriteButton';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name';

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  name: 'Name A–Z',
};

function ProductCard({ product }: { product: Product }) {
  const discount = product.original_price_lbp
    ? Math.round((1 - product.price_lbp / product.original_price_lbp) * 100)
    : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all relative"
    >
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <Package className="w-8 h-8 text-muted-foreground/30" />}
        {discount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-xs">-{discount}%</Badge>
        )}
        <div className="absolute top-2 right-2">
          <FavoriteButton productId={product.id} size="sm" />
        </div>
      </div>
      <div className="p-3">
        {product.brand && <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>}
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-1">{product.name}</p>
        <p className="font-bold text-primary text-sm">{formatLBP(product.price_lbp)}</p>
        {product.original_price_lbp && (
          <p className="text-xs text-muted-foreground line-through">{formatLBP(product.original_price_lbp)}</p>
        )}
        {product.store && <p className="text-xs text-muted-foreground mt-1 truncate">{product.store.name}</p>}
      </div>
    </Link>
  );
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const submitRequest = useSubmitProductRequest();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [brandFilter, setBrandFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestBrand, setRequestBrand] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: rawProducts = [], isLoading } = useProducts({
    search: search.trim() || undefined,
    categorySlug: activeCategory || undefined,
  });

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params, { replace: true });
  }, [search, activeCategory, setSearchParams]);

  const products = useMemo(() => {
    let list = [...rawProducts];
    if (inStockOnly) list = list.filter((p) => p.in_stock);
    if (brandFilter) list = list.filter((p) => p.brand?.toLowerCase().includes(brandFilter.toLowerCase()));
    switch (sort) {
      case 'price_asc': list.sort((a, b) => a.price_lbp - b.price_lbp); break;
      case 'price_desc': list.sort((a, b) => b.price_lbp - a.price_lbp); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [rawProducts, sort, brandFilter, inStockOnly]);

  const brands = useMemo(() => {
    const set = new Set(rawProducts.map((p) => p.brand).filter(Boolean) as string[]);
    return [...set].sort();
  }, [rawProducts]);

  const hasActiveFilters = activeCategory || sort !== 'relevance' || brandFilter || inStockOnly;

  const handleSubmitRequest = async () => {
    if (!requestName.trim()) return;
    await submitRequest.mutateAsync({ name: requestName.trim(), brand: requestBrand.trim() || undefined, user_id: user?.id });
    toast({ title: 'Request submitted!' });
    setShowRequestForm(false); setRequestName(''); setRequestBrand('');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplements, brands..."
              className="pl-10 h-11 rounded-xl bg-muted border-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCategory === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
            >All</button>
            {categories.map((cat) => (
              <button key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug ?? '')}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCategory === cat.slug ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
              >{cat.icon} {cat.name}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
                className="h-8 pl-7 pr-6 rounded-xl border border-border bg-background text-xs appearance-none text-foreground">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                  <option key={s} value={s}>{SORT_LABELS[s]}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1 h-8 px-3 rounded-xl border text-xs font-medium transition-colors ${showFilters || brandFilter || inStockOnly ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Filters
              {(brandFilter || inStockOnly) && (
                <span className="w-4 h-4 rounded-full bg-primary-foreground text-primary text-[9px] font-black flex items-center justify-center">
                  {(brandFilter ? 1 : 0) + (inStockOnly ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button onClick={() => { setActiveCategory(''); setSort('relevance'); setBrandFilter(''); setInStockOnly(false); }}
                className="ml-auto text-xs text-primary font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-2 p-3 rounded-xl bg-muted space-y-3">
              {brands.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Brand</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brands.map((b) => (
                      <button key={b}
                        onClick={() => setBrandFilter(brandFilter === b ? '' : b)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${brandFilter === b ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-background'}`}
                      >{b}</button>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="rounded" />
                <span className="text-xs text-foreground font-medium">In stock only</span>
              </label>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {isLoading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {search ? `No results for "${search}"` : 'No products found'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {search ? 'This supplement might not be stocked yet.' : 'Try a different filter.'}
              </p>
              {search && !showRequestForm && (
                <Button variant="outline" onClick={() => { setShowRequestForm(true); setRequestName(search); }}>
                  Request this product
                </Button>
              )}
              {showRequestForm && (
                <div className="max-w-sm mx-auto text-left space-y-3 mt-4">
                  <p className="text-sm font-medium text-center text-foreground">Let us find it for you</p>
                  <Input value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="Product name" className="rounded-xl" />
                  <Input value={requestBrand} onChange={(e) => setRequestBrand(e.target.value)} placeholder="Brand (optional)" className="rounded-xl" />
                  <Button className="w-full" onClick={handleSubmitRequest} disabled={!requestName.trim() || submitRequest.isPending}>
                    {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <button onClick={() => setShowRequestForm(false)} className="w-full text-xs text-muted-foreground">Cancel</button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
