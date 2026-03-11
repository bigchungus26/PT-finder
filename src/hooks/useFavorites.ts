import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FavoriteRow {
  id: string;
  user_id: string;
  product_id: string | null;
  store_id: string | null;
  created_at: string;
}

export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []) as FavoriteRow[];
    },
    enabled: !!userId,
  });
}

export function useIsFavorite(userId?: string, productId?: string, storeId?: string) {
  const { data: favs = [] } = useFavorites(userId);
  if (productId) return favs.some((f) => f.product_id === productId);
  if (storeId) return favs.some((f) => f.store_id === storeId);
  return false;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      productId,
      storeId,
      isFav,
    }: {
      userId: string;
      productId?: string;
      storeId?: string;
      isFav: boolean;
    }) => {
      if (isFav) {
        // Remove
        let q = supabase.from('favorites').delete().eq('user_id', userId);
        if (productId) q = q.eq('product_id', productId);
        if (storeId) q = q.eq('store_id', storeId);
        const { error } = await q;
        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase.from('favorites').insert({
          user_id: userId,
          product_id: productId ?? null,
          store_id: storeId ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
}
