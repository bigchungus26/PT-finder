-- Stackr seed data: sample Lebanese supplement stores + products
-- Run after migration 016

-- ─── STORES ────────────────────────────────────────────────
insert into public.stores (id, name, slug, description, city, address, phone, whatsapp, instagram, is_active, delivery_fee_lbp, min_order_lbp, estimated_delivery_minutes, rating_avg, total_reviews)
values
(
  '11111111-0000-0000-0000-000000000001',
  'Protein Palace',
  'protein-palace',
  'Lebanon''s biggest supplement store. Authentic products, best prices, same-day delivery across Beirut.',
  'Beirut', 'Hamra Street, Beirut', '+961 1 234 567', '+961 70 234 567', '@proteinpalace.lb',
  true, 20000, 150000, 40, 4.8, 124
),
(
  '11111111-0000-0000-0000-000000000002',
  'Stack House',
  'stack-house',
  'Gym-run store stocking all the serious stacks. Whey, creatine, pre-workouts from top brands.',
  'Beirut', 'Achrafieh, Beirut', '+961 1 345 678', '+961 71 345 678', '@stackhouse.lb',
  true, 15000, 100000, 35, 4.6, 87
),
(
  '11111111-0000-0000-0000-000000000003',
  'NutriZone',
  'nutrizone',
  'Health-first supplements — vitamins, clean proteins, and natural products for a healthy lifestyle.',
  'Jounieh', 'Downtown Jounieh', '+961 9 456 789', '+961 76 456 789', '@nutrizone.lb',
  true, 25000, 200000, 60, 4.5, 56
)
on conflict (id) do nothing;

-- ─── PRODUCTS ──────────────────────────────────────────────

-- Protein Palace products
insert into public.products (store_id, category_id, name, brand, description, price_lbp, original_price_lbp, weight_g, servings, flavors, in_stock, is_featured)
values
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='protein'),
  'Gold Standard 100% Whey', 'Optimum Nutrition',
  'The world''s best-selling whey protein. 24g protein per serving, low sugar, amazing taste.',
  585000, 650000, 2270, 74,
  ARRAY['Double Rich Chocolate','Vanilla Ice Cream','Strawberry','Cookies & Cream','Banana Cream'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='creatine'),
  'Micronized Creatine Monohydrate', 'Optimum Nutrition',
  'Pure creatine monohydrate, micronized for better absorption. 5g per serving.',
  195000, null, 300, 60,
  ARRAY['Unflavored'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='pre-workout'),
  'C4 Original Pre-Workout', 'Cellucor',
  'America''s #1 pre-workout. 150mg caffeine, beta-alanine, creatine nitrate.',
  320000, 370000, 195, 30,
  ARRAY['Watermelon','Fruit Punch','Pink Lemonade','Icy Blue Razz'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='mass-gainers'),
  'Serious Mass', 'Optimum Nutrition',
  '1,250 calories per serving. 50g protein, 252g carbs. For hard gainers.',
  720000, null, 5440, 16,
  ARRAY['Chocolate','Vanilla','Banana','Strawberry'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='amino-acids'),
  'BCAA 2:1:1', 'Scivation Xtend',
  '7g BCAAs per serving. Leucine, Isoleucine, Valine in the proven 2:1:1 ratio.',
  285000, null, 420, 30,
  ARRAY['Mango Madness','Blue Raspberry','Watermelon','Grape'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000001',
  (select id from supplement_categories where slug='fat-burners'),
  'Hydroxycut Hardcore Elite', 'Muscletech',
  'Extreme weight loss formula with 270mg caffeine. Not for beginners.',
  265000, 310000, null, 100,
  ARRAY['Capsules'],
  true, false
),

-- Stack House products
(
  '11111111-0000-0000-0000-000000000002',
  (select id from supplement_categories where slug='protein'),
  'ISO100 Hydrolyzed Whey', 'Dymatize',
  'Fastest-absorbing protein. 100% hydrolyzed whey isolate. 25g protein, 0g sugar.',
  650000, null, 1400, 44,
  ARRAY['Gourmet Chocolate','Vanilla','Strawberry','Birthday Cake'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000002',
  (select id from supplement_categories where slug='pre-workout'),
  'Pre-Kaged Elite', 'Kaged',
  'Premium all-natural pre-workout. 388mg caffeine, 6.5g L-Citrulline.',
  495000, 550000, 574, 20,
  ARRAY['Orange Mango','Grape','Berry Blast'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000002',
  (select id from supplement_categories where slug='creatine'),
  'Con-Cret Creatine HCl', 'ProMera Sports',
  'Creatine HCl — more bioavailable, no loading phase, no bloating.',
  230000, null, 64, 64,
  ARRAY['Unflavored','Cherry Lime','Grape'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000002',
  (select id from supplement_categories where slug='recovery'),
  'Glutamine Powder', 'Cellucor',
  '5g L-Glutamine per serving. Supports muscle recovery and immune function.',
  185000, null, 300, 60,
  ARRAY['Unflavored'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000002',
  (select id from supplement_categories where slug='snacks-bars'),
  'Quest Bar (Box of 12)', 'Quest Nutrition',
  '20g protein, 5g net carbs, high fiber. Doesn''t taste like cardboard.',
  380000, null, null, 12,
  ARRAY['Chocolate Chip Cookie Dough','Cookies & Cream','Birthday Cake','Peanut Butter Chocolate'],
  true, false
),

-- NutriZone products
(
  '11111111-0000-0000-0000-000000000003',
  (select id from supplement_categories where slug='vitamins'),
  'Vitamin D3 + K2 (5000 IU)', 'Now Foods',
  'Essential for Lebanese winters. D3 and K2 together for optimal absorption and heart health.',
  95000, null, null, 120,
  ARRAY['Capsules'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000003',
  (select id from supplement_categories where slug='vitamins'),
  'Omega-3 Fish Oil (180 softgels)', 'Now Foods',
  '1000mg EPA+DHA per serving. Anti-inflammatory, heart and brain health.',
  135000, 155000, null, 90,
  ARRAY['Softgels'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000003',
  (select id from supplement_categories where slug='protein'),
  'Organic Plant Protein', 'Garden of Life',
  '22g plant protein. Organic pea, sprout blend. Vegan and clean.',
  520000, null, 680, 20,
  ARRAY['Vanilla','Chocolate','Unflavored'],
  true, false
),
(
  '11111111-0000-0000-0000-000000000003',
  (select id from supplement_categories where slug='hydration'),
  'Liquid I.V. Hydration Multiplier (30 pack)', 'Liquid I.V.',
  '3× hydration vs water alone. CTT technology. Perfect post-workout.',
  275000, null, null, 30,
  ARRAY['Lemon Lime','Tropical Punch','Acai Berry'],
  true, true
),
(
  '11111111-0000-0000-0000-000000000003',
  (select id from supplement_categories where slug='vitamins'),
  'Magnesium Glycinate (200mg)', 'Doctor''s Best',
  'High absorption magnesium. Supports sleep, muscle relaxation, and stress.',
  110000, null, null, 120,
  ARRAY['Capsules'],
  true, false
)
on conflict do nothing;
