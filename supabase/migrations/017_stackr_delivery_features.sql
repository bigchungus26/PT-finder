-- ============================================================
-- 017: Stackr — Delivery App Feature Pack
-- Favorites, promo codes, store hours, reviews
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- 1. FAVORITES (products + stores)
-- ───────────────────────────────────────────────────────────
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid references public.products(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete cascade,
  created_at  timestamptz default now(),
  constraint fav_one_of check (product_id is not null or store_id is not null),
  unique (user_id, product_id),
  unique (user_id, store_id)
);

alter table public.favorites enable row level security;
create policy "favorites_own" on public.favorites for all using (user_id = auth.uid());
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists favorites_product_idx on public.favorites(product_id);

-- ───────────────────────────────────────────────────────────
-- 2. PROMO CODES
-- ───────────────────────────────────────────────────────────
create table if not exists public.promo_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  discount_type   text not null check (discount_type in ('flat', 'percent')),
  discount_value  integer not null,    -- flat = LBP amount, percent = 0-100
  min_order_lbp   integer default 0,
  max_uses        integer,             -- null = unlimited
  used_count      integer default 0,
  expires_at      timestamptz,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

alter table public.promo_codes enable row level security;
-- Anyone can read active promo codes (to validate)
create policy "promos_select" on public.promo_codes
  for select using (is_active = true);

-- Seed promo codes
insert into public.promo_codes (code, discount_type, discount_value, min_order_lbp, max_uses)
values
  ('STACK10',  'percent', 10,  200000, null),
  ('NEWUSER',  'flat',    50000, 0,    1000),
  ('GAINZ15',  'percent', 15,  500000, null),
  ('FREESHIP', 'flat',    30000, 150000, 500)
on conflict (code) do nothing;

-- ───────────────────────────────────────────────────────────
-- 3. STORE HOURS
-- ───────────────────────────────────────────────────────────
create table if not exists public.store_hours (
  id          serial primary key,
  store_id    uuid not null references public.stores(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun
  open_time   time,     -- null = closed that day
  close_time  time,
  unique (store_id, day_of_week)
);

alter table public.store_hours enable row level security;
create policy "store_hours_select" on public.store_hours for select using (true);

-- Seed hours for our sample stores (Mon-Sat 9am-9pm, closed Sun)
insert into public.store_hours (store_id, day_of_week, open_time, close_time)
select s.id, d.day, '09:00'::time, '21:00'::time
from public.stores s
cross join (values (1),(2),(3),(4),(5),(6)) as d(day)
where s.id in (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003'
)
on conflict do nothing;

-- ───────────────────────────────────────────────────────────
-- 4. USED PROMO CODES (track per user)
-- ───────────────────────────────────────────────────────────
create table if not exists public.used_promos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  promo_id    uuid not null references public.promo_codes(id),
  order_id    uuid references public.orders(id),
  created_at  timestamptz default now(),
  unique (user_id, promo_id)
);

alter table public.used_promos enable row level security;
create policy "used_promos_own" on public.used_promos for all using (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────
-- 5. ORDERS: add promo_code_id + discount_lbp columns
-- ───────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists promo_code    text,
  add column if not exists discount_lbp  integer default 0;

-- ───────────────────────────────────────────────────────────
-- 6. PRODUCTS: view count for trending
-- ───────────────────────────────────────────────────────────
alter table public.products
  add column if not exists view_count integer default 0;

-- Function to increment view count safely
create or replace function public.increment_product_view(p_id uuid)
returns void language sql security definer as $$
  update public.products set view_count = view_count + 1 where id = p_id;
$$;
