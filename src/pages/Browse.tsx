import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Package, X, Filter } from 'lucide-react';
import { useProducts, useCategories, useSubmitProductRequest } from '@/hooks/useStores';
import { useAuth } from '@/contexts/AuthContext';
import { formatLBP } from '@/types/stackr';
import type { Product } from '@/types/stackr';
import { useToast } from '@/hooks/use-toast';

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
      </div>
      <div className="p-3">
        {product.brand && (
          <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
        )}
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-1">{product.name}</p>
        <p className="font-bold text-primary text-sm">{formatLBP(product.price_lbp)}</p>
        {product.store && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{product.store.name}</p>
        )}
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
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestName, setRequestName] = useState(search);
  const [requestBrand, setRequestBrand] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({
    search: search.trim() || undefined,
    categorySlug: activeCategory || undefined,
  });

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params, { replace: true });
  }, [search, activeCategory, setSearchParams]);

  const handleCategoryToggle = (slug: string) => {
    setActiveCategory((prev) => (prev === slug ? '' : slug));
  };

  const handleSubmitRequest = async () => {
    if (!requestName.trim()) return;
    await submitRequest.mutateAsync({
      name: requestName.trim(),
      brand: requestBrand.trim() || undefined,
      user_id: user?.id,
    });
    toast({ title: 'Request submitted!', description: 'We\'ll notify stores to stock this product.' });
    setShowRequestForm(false);
    setRequestName('');
    setRequestBrand('');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Search bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplements, brands..."
              className="pl-10 h-11 rounded-xl bg-muted border-0 focus-visible:ring-1"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === ''
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.slug ?? '')}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(''); setActiveCategory(''); }}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {search ? `No results for "${search}"` : 'No products found'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {search ? "This supplement might not be stocked yet." : "Try a different category."}
              </p>
              {search && !showRequestForm && (
                <Button variant="outline" onClick={() => { setShowRequestForm(true); setRequestName(search); }}>
                  Request this product
                </Button>
              )}
              {showRequestForm && (
                <div className="max-w-sm mx-auto text-left space-y-3 mt-4">
                  <p className="text-sm font-medium text-foreground text-center">Let us find it for you</p>
                  <Input
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Product name"
                  />
                  <Input
                    value={requestBrand}
                    onChange={(e) => setRequestBrand(e.target.value)}
                    placeholder="Brand (optional)"
                  />
                  <Button
                    className="w-full"
                    onClick={handleSubmitRequest}
                    disabled={!requestName.trim() || submitRequest.isPending}
                  >
                    {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="w-full text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
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
