import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Store, Product, SupplementCategory } from '@/types/stackr';

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('rating_avg', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });
}

export function useStore(storeId?: string) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId!)
        .single();
      if (error) throw error;
      return data as Store;
    },
    enabled: !!storeId,
  });
}

export function useStoreBySlug(slug?: string) {
  return useQuery({
    queryKey: ['store-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug!)
        .single();
      if (error) throw error;
      return data as Store;
    },
    enabled: !!slug,
  });
}

export function useStoreProducts(storeId?: string) {
  return useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:supplement_categories(*)')
        .eq('store_id', storeId!)
        .order('is_featured', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data ?? []) as (Product & { category: SupplementCategory | null })[];
    },
    enabled: !!storeId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['supplement-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplement_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as SupplementCategory[];
    },
  });
}

export function useProducts(opts?: { categorySlug?: string; search?: string; storeId?: string }) {
  return useQuery({
    queryKey: ['products', opts],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, store:stores(*), category:supplement_categories(*)')
        .eq('in_stock', true);

      if (opts?.storeId) q = q.eq('store_id', opts.storeId);
      if (opts?.search) q = q.ilike('name', `%${opts.search}%`);
      if (opts?.categorySlug) {
        const { data: cat } = await supabase
          .from('supplement_categories')
          .select('id')
          .eq('slug', opts.categorySlug)
          .single();
        if (cat) q = q.eq('category_id', cat.id);
      }

      const { data, error } = await q
        .order('is_featured', { ascending: false })
        .order('name')
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(*), category:supplement_categories(*)')
        .eq('is_featured', true)
        .eq('in_stock', true)
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useProduct(productId?: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(*), category:supplement_categories(*)')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(*), category:supplement_categories(*)')
        .eq('in_stock', true)
        .order('view_count', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useStoreHours(storeId?: string) {
  return useQuery({
    queryKey: ['store-hours', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', storeId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
}

export function useIncrementView() {
  return useMutation({
    mutationFn: async (productId: string) => {
      await supabase.rpc('increment_product_view', { p_id: productId });
    },
  });
}

export function useSubmitProductRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; brand?: string; notes?: string; user_id?: string }) => {
      const { error } = await supabase.from('product_requests').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-requests'] });
    },
  });
}
