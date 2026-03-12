-- 018: Fix profile fields + store free delivery threshold
-- Adds saved_address/city/phone to profiles (already added in 016,
-- this is a safety no-op). Adds free_delivery_above_lbp to stores.

alter table public.stores
  add column if not exists free_delivery_above_lbp integer;

-- Set thresholds for the seed stores
update public.stores set free_delivery_above_lbp = 500000
  where id = '11111111-0000-0000-0000-000000000001';
update public.stores set free_delivery_above_lbp = 400000
  where id = '11111111-0000-0000-0000-000000000002';
update public.stores set free_delivery_above_lbp = 600000
  where id = '11111111-0000-0000-0000-000000000003';
