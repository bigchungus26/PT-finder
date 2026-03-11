import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PromoResult {
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderLBP: number;
  promoId: string;
}

export function usePromoCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState<PromoResult | null>(null);

  const validate = useCallback(async (code: string, orderTotal: number, userId?: string) => {
    setLoading(true);
    setError(null);
    setPromo(null);

    try {
      const { data, error: dbError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Invalid promo code.');
        return null;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This promo code has expired.');
        return null;
      }

      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        setError('This promo code has reached its usage limit.');
        return null;
      }

      if (orderTotal < data.min_order_lbp) {
        const fmtMin = new Intl.NumberFormat('en-US').format(data.min_order_lbp);
        setError(`Minimum order of ${fmtMin} LBP required.`);
        return null;
      }

      // Check if user already used it
      if (userId) {
        const { data: used } = await supabase
          .from('used_promos')
          .select('id')
          .eq('user_id', userId)
          .eq('promo_id', data.id)
          .maybeSingle();
        if (used) {
          setError('You\'ve already used this promo code.');
          return null;
        }
      }

      const result: PromoResult = {
        code: data.code,
        discountType: data.discount_type as 'flat' | 'percent',
        discountValue: data.discount_value,
        minOrderLBP: data.min_order_lbp,
        promoId: data.id,
      };
      setPromo(result);
      return result;
    } catch {
      setError('Failed to validate code. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPromo(null);
    setError(null);
  }, []);

  const getDiscount = useCallback((subtotal: number): number => {
    if (!promo) return 0;
    if (promo.discountType === 'flat') return Math.min(promo.discountValue, subtotal);
    return Math.round(subtotal * (promo.discountValue / 100));
  }, [promo]);

  return { validate, clear, loading, error, promo, getDiscount };
}
