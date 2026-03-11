import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem } from '@/types/stackr';

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, store:stores(id,name,logo_url), items:order_items(*)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: !!userId,
  });
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, store:stores(*), items:order_items(*)')
        .eq('id', orderId!)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll actively until delivered or cancelled
      if (status && ['delivered', 'cancelled'].includes(status)) return false;
      return 20_000; // every 20s
    },
  });
}

export interface PlaceOrderInput {
  user_id: string;
  store_id: string;
  total_lbp: number;
  delivery_fee_lbp: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  notes?: string;
  estimated_delivery_minutes: number;
  items: Array<{
    product_id: string;
    product_name: string;
    product_brand: string | null;
    product_image: string | null;
    unit_price_lbp: number;
    quantity: number;
    flavor: string | null;
  }>;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      const estimated_delivery_at = new Date(
        Date.now() + input.estimated_delivery_minutes * 60 * 1000
      ).toISOString();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: input.user_id,
          store_id: input.store_id,
          total_lbp: input.total_lbp,
          delivery_fee_lbp: input.delivery_fee_lbp,
          delivery_name: input.delivery_name,
          delivery_phone: input.delivery_phone,
          delivery_address: input.delivery_address,
          delivery_city: input.delivery_city,
          notes: input.notes,
          estimated_delivery_at,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // Insert order items
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_brand: item.product_brand,
        product_image: item.product_image,
        unit_price_lbp: item.unit_price_lbp,
        quantity: item.quantity,
        flavor: item.flavor,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['orders', input.user_id] });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId, userId, orderId, rating, comment,
    }: { storeId: string; userId: string; orderId: string; rating: number; comment?: string }) => {
      const { error } = await supabase.from('store_reviews').insert({
        store_id: storeId, user_id: userId, order_id: orderId, rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ['store', storeId] });
    },
  });
}
