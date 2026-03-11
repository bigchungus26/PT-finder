// Stackr — Supplement Ordering App types

export interface Store {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  owner_id: string | null;
  is_active: boolean;
  delivery_fee_lbp: number;
  min_order_lbp: number;
  estimated_delivery_minutes: number;
  rating_avg: number;
  total_reviews: number;
  created_at: string;
}

export interface SupplementCategory {
  id: number;
  name: string;
  icon: string | null;
  slug: string | null;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: number | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  price_lbp: number;
  original_price_lbp: number | null;
  weight_g: number | null;
  servings: number | null;
  flavor: string | null;
  flavors: string[];
  in_stock: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  // joined
  store?: Store;
  category?: SupplementCategory;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  status: OrderStatus;
  total_lbp: number;
  delivery_fee_lbp: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  notes: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  // joined
  store?: Store;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_brand: string | null;
  product_image: string | null;
  unit_price_lbp: number;
  quantity: number;
  flavor: string | null;
}

// Cart lives in memory / localStorage
export interface CartItem {
  product: Product;
  quantity: number;
  flavor: string | null;
}

export interface ProductRequest {
  id: string;
  user_id: string | null;
  name: string;
  brand: string | null;
  notes: string | null;
  fulfilled: boolean;
  created_at: string;
}

// Format LBP price nicely
export function formatLBP(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount) + ' LBP';
}

export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
  preparing: 'text-orange-600 bg-orange-50 border-orange-200',
  out_for_delivery: 'text-purple-600 bg-purple-50 border-purple-200',
  delivered: 'text-green-600 bg-green-50 border-green-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
};
