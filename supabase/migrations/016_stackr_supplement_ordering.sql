-- ============================================================
-- 016: Stackr — Supplement Ordering App for Lebanon
-- Replaces the PT Finder data model with a supplement
-- marketplace: stores, products, cart, orders, delivery.
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- 1. SUPPLEMENT STORES
-- ───────────────────────────────────────────────────────────
create table if not exists public.stores (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  slug                        text unique,
  description                 text,
  logo_url                    text,
  banner_url                  text,
  city                        text not null default 'Beirut',
  address                     text,
  phone                       text,
  whatsapp                    text,
  instagram                   text,
  owner_id                    uuid references auth.users(id) on delete set null,
  is_active                   boolean not null default true,
  delivery_fee_lbp            integer not null default 0,
  min_order_lbp               integer not null default 0,
  estimated_delivery_minutes  integer not null default 45,
  rating_avg                  numeric(3,2) default 0,
  total_reviews               integer default 0,
  created_at                  timestamptz default now()
);

-- ───────────────────────────────────────────────────────────
-- 2. SUPPLEMENT CATEGORIES
-- ───────────────────────────────────────────────────────────
create table if not exists public.supplement_categories (
  id    serial primary key,
  name  text not null unique,
  icon  text,
  slug  text unique
);

insert into public.supplement_categories (name, icon, slug) values
  ('Protein',       '🥛', 'protein'),
  ('Creatine',      '💪', 'creatine'),
  ('Pre-Workout',   '⚡', 'pre-workout'),
  ('Vitamins',      '💊', 'vitamins'),
  ('Fat Burners',   '🔥', 'fat-burners'),
  ('Mass Gainers',  '📈', 'mass-gainers'),
  ('Amino Acids',   '🧬', 'amino-acids'),
  ('Recovery',      '🛌', 'recovery'),
  ('Hydration',     '💧', 'hydration'),
  ('Snacks & Bars', '🍫', 'snacks-bars')
on conflict (slug) do nothing;

-- ───────────────────────────────────────────────────────────
-- 3. PRODUCTS (SUPPLEMENTS)
-- ───────────────────────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  category_id   integer references public.supplement_categories(id),
  name          text not null,
  brand         text,
  description   text,
  image_url     text,
  price_lbp     integer not null,
  original_price_lbp integer,   -- for showing discounts
  weight_g      integer,        -- package weight in grams
  servings      integer,        -- number of servings
  flavor        text,
  flavors       text[] default '{}',
  in_stock      boolean not null default true,
  is_featured   boolean not null default false,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

-- ───────────────────────────────────────────────────────────
-- 4. ORDERS
-- ───────────────────────────────────────────────────────────
create type if not exists order_status as enum (
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
);

create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  store_id                  uuid not null references public.stores(id),
  status                    order_status not null default 'pending',
  total_lbp                 integer not null,
  delivery_fee_lbp          integer not null default 0,
  delivery_name             text not null,
  delivery_phone            text not null,
  delivery_address          text not null,
  delivery_city             text not null default 'Beirut',
  notes                     text,
  estimated_delivery_at     timestamptz,
  delivered_at              timestamptz,
  created_at                timestamptz default now()
);

-- ───────────────────────────────────────────────────────────
-- 5. ORDER ITEMS
-- ───────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,   -- snapshot at time of order
  product_brand   text,
  product_image   text,
  unit_price_lbp  integer not null,
  quantity        integer not null default 1,
  flavor          text
);

-- ───────────────────────────────────────────────────────────
-- 6. STORE REVIEWS
-- ───────────────────────────────────────────────────────────
create table if not exists public.store_reviews (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now(),
  unique (store_id, user_id, order_id)
);

-- ───────────────────────────────────────────────────────────
-- 7. PRODUCT REQUESTS (if supplement not found)
-- ───────────────────────────────────────────────────────────
create table if not exists public.product_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  brand       text,
  notes       text,
  fulfilled   boolean not null default false,
  created_at  timestamptz default now()
);

-- ───────────────────────────────────────────────────────────
-- 8. RLS POLICIES
-- ───────────────────────────────────────────────────────────
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_reviews enable row level security;
alter table public.product_requests enable row level security;
alter table public.supplement_categories enable row level security;

-- stores: anyone can read active stores
create policy "stores_select" on public.stores for select using (is_active = true);
create policy "stores_owner_all" on public.stores for all using (owner_id = auth.uid());

-- products: anyone can read products from active stores
create policy "products_select" on public.products
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.is_active = true)
  );
create policy "products_store_owner" on public.products
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- orders: users see only their own orders
create policy "orders_own" on public.orders for all using (user_id = auth.uid());

-- order_items: users see items on their own orders
create policy "order_items_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- reviews: anyone can read; users can write their own
create policy "reviews_select" on public.store_reviews for select using (true);
create policy "reviews_insert" on public.store_reviews for insert with check (user_id = auth.uid());

-- categories: public read
create policy "categories_select" on public.supplement_categories for select using (true);

-- product requests: authenticated users can insert/read their own
create policy "requests_own" on public.product_requests for all using (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────
-- 9. INDEXES
-- ───────────────────────────────────────────────────────────
create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_store_idx on public.orders(store_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists stores_city_idx on public.stores(city);

-- ───────────────────────────────────────────────────────────
-- 10. PROFILES TABLE: simplify for delivery app users
-- ───────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists saved_address text,
  add column if not exists saved_city    text,
  add column if not exists saved_phone   text;
