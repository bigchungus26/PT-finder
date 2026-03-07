-- Seed sample Lebanese trainers for demo purposes
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- First, create auth users for the trainers (required for profile creation)
-- We use Supabase's auth.users table directly

DO $$
DECLARE
  t1_id uuid := 'a1000001-0000-0000-0000-000000000001';
  t2_id uuid := 'a1000002-0000-0000-0000-000000000002';
  t3_id uuid := 'a1000003-0000-0000-0000-000000000003';
  t4_id uuid := 'a1000004-0000-0000-0000-000000000004';
  t5_id uuid := 'a1000005-0000-0000-0000-000000000005';
  t6_id uuid := 'a1000006-0000-0000-0000-000000000006';
  t7_id uuid := 'a1000007-0000-0000-0000-000000000007';
  t8_id uuid := 'a1000008-0000-0000-0000-000000000008';
BEGIN

-- Create auth entries (password = 'demo12345' hashed)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  (t1_id, '00000000-0000-0000-0000-000000000000', 'karim.haddad@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t2_id, '00000000-0000-0000-0000-000000000000', 'nour.mansour@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t3_id, '00000000-0000-0000-0000-000000000000', 'rami.khoury@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t4_id, '00000000-0000-0000-0000-000000000000', 'maya.farhat@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t5_id, '00000000-0000-0000-0000-000000000000', 'tony.abi.nader@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t6_id, '00000000-0000-0000-0000-000000000000', 'lara.gemayel@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t7_id, '00000000-0000-0000-0000-000000000000', 'ziad.saab@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  (t8_id, '00000000-0000-0000-0000-000000000000', 'sarah.daher@demo.kotch', crypt('demo12345', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create identities (required by Supabase auth)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  (t1_id, t1_id, t1_id, 'email', jsonb_build_object('sub', t1_id, 'email', 'karim.haddad@demo.kotch'), now(), now(), now()),
  (t2_id, t2_id, t2_id, 'email', jsonb_build_object('sub', t2_id, 'email', 'nour.mansour@demo.kotch'), now(), now(), now()),
  (t3_id, t3_id, t3_id, 'email', jsonb_build_object('sub', t3_id, 'email', 'rami.khoury@demo.kotch'), now(), now(), now()),
  (t4_id, t4_id, t4_id, 'email', jsonb_build_object('sub', t4_id, 'email', 'maya.farhat@demo.kotch'), now(), now(), now()),
  (t5_id, t5_id, t5_id, 'email', jsonb_build_object('sub', t5_id, 'email', 'tony.abi.nader@demo.kotch'), now(), now(), now()),
  (t6_id, t6_id, t6_id, 'email', jsonb_build_object('sub', t6_id, 'email', 'lara.gemayel@demo.kotch'), now(), now(), now()),
  (t7_id, t7_id, t7_id, 'email', jsonb_build_object('sub', t7_id, 'email', 'ziad.saab@demo.kotch'), now(), now(), now()),
  (t8_id, t8_id, t8_id, 'email', jsonb_build_object('sub', t8_id, 'email', 'sarah.daher@demo.kotch'), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Upsert profiles
INSERT INTO public.profiles (id, name, email, user_role, city, area, gym, bio_expert, hourly_rate, specialty, certifications, years_experience, clients_worked_with, age, gender, trainer_type, verified_status, rating_avg, total_reviews, offers_home_training, home_training_cities, offers_diet_plan, testimonials)
VALUES
  (t1_id, 'Karim Haddad', 'karim.haddad@demo.kotch', 'trainer',
   'Beirut', 'Achrafieh', 'Jefit Gym Achrafieh',
   'NASM-certified trainer specializing in body transformations and strength. 8 years of experience helping clients achieve physique goals with structured programs.',
   40, ARRAY['Bodybuilding', 'Strength Training', 'Weight Loss'], ARRAY['NASM-CPT', 'NSCA-CSCS', 'First Aid / CPR'],
   8, 120, 30, 'male', 'gym_affiliated', true, 4.8, 34,
   true, ARRAY['Beirut', 'Jounieh'], true,
   '[{"name":"Ali M.","text":"Karim helped me lose 15kg in 4 months. Incredible dedication and knowledge.","date":"2025-09-15"},{"name":"Marc K.","text":"Best trainer I have ever worked with. Knows exactly how to push you.","date":"2025-11-02"}]'::jsonb),

  (t2_id, 'Nour Mansour', 'nour.mansour@demo.kotch', 'trainer',
   'Beirut', 'Hamra', 'Gold''s Gym Hamra',
   'Certified yoga and pilates instructor with a focus on flexibility, mobility, and mind-body connection. Also offering postnatal fitness programs.',
   35, ARRAY['Yoga', 'Pilates', 'Flexibility & Mobility', 'Pre/Post Natal'], ARRAY['ACE-CPT', 'ACE-GFI', 'Precision Nutrition'],
   6, 85, 28, 'female', 'gym_affiliated', true, 4.9, 28,
   true, ARRAY['Beirut', 'Baabda'], true,
   '[{"name":"Rana S.","text":"Nour''s postnatal classes were a lifesaver. Gentle yet effective.","date":"2025-10-20"},{"name":"Dina H.","text":"I finally can touch my toes after 3 months with Nour!","date":"2025-12-01"}]'::jsonb),

  (t3_id, 'Rami Khoury', 'rami.khoury@demo.kotch', 'trainer',
   'Jounieh', 'Kaslik', 'Titan Fitness Kaslik',
   'CrossFit Level 2 coach and former competitive athlete. I specialize in high-intensity functional training and sports performance for athletes of all levels.',
   50, ARRAY['CrossFit', 'HIIT', 'Sports Performance', 'Functional Training'], ARRAY['CrossFit Level 2', 'NASM-PES', 'First Aid / CPR'],
   10, 200, 33, 'male', 'gym_affiliated', true, 4.7, 45,
   false, ARRAY[]::text[], false,
   '[{"name":"Joe B.","text":"Rami''s CrossFit classes are next level. I gained so much strength and endurance.","date":"2025-08-10"},{"name":"Charbel N.","text":"Trained for a marathon with Rami. Finished my first one thanks to him!","date":"2025-11-22"}]'::jsonb),

  (t4_id, 'Maya Farhat', 'maya.farhat@demo.kotch', 'trainer',
   'Tripoli', 'El Mina', 'FitZone Tripoli',
   'Passionate about women''s fitness and empowerment. Specializing in weight loss transformations and nutrition coaching with sustainable, realistic plans.',
   30, ARRAY['Weight Loss', 'Nutrition Coaching', 'HIIT', 'Senior Fitness'], ARRAY['ISSA-CPT', 'NASM-CNC', 'Precision Nutrition'],
   5, 60, 26, 'female', 'freelancer', true, 4.6, 18,
   true, ARRAY['Tripoli', 'Byblos', 'Batroun'], true,
   '[{"name":"Hala A.","text":"Maya''s diet plans are so easy to follow. I actually enjoy eating healthy now!","date":"2025-10-05"},{"name":"Nadine F.","text":"Lost 10kg in 3 months. Maya is motivating and very knowledgeable.","date":"2025-12-15"}]'::jsonb),

  (t5_id, 'Tony Abi Nader', 'tony.abi.nader@demo.kotch', 'trainer',
   'Beirut', 'Verdun', 'V Fitness Verdun',
   'Celebrity trainer and boxing coach. 12 years training professional athletes and executives. If you want results, I will push you to your limits.',
   80, ARRAY['Boxing / Kickboxing', 'Strength Training', 'HIIT', 'Calisthenics'], ARRAY['NASM-CPT', 'ACSM-CPT', 'First Aid / CPR'],
   12, 300, 38, 'male', 'freelancer', true, 4.9, 52,
   true, ARRAY['Beirut', 'Metn'], false,
   '[{"name":"Fadi R.","text":"Tony is the real deal. I trained with many coaches but no one pushes like him.","date":"2025-07-18"},{"name":"Serge M.","text":"My boxing skills and fitness level improved dramatically in just 2 months.","date":"2025-09-30"}]'::jsonb),

  (t6_id, 'Lara Gemayel', 'lara.gemayel@demo.kotch', 'trainer',
   'Byblos', 'Jbeil', 'Oxygen Gym Jbeil',
   'Injury rehabilitation specialist and certified personal trainer. Helping clients recover from injuries and build strength safely with personalized programs.',
   45, ARRAY['Injury Rehab', 'Functional Training', 'Flexibility & Mobility', 'Senior Fitness'], ARRAY['ACSM-CPT', 'NASM-PES', 'First Aid / CPR'],
   7, 90, 31, 'female', 'gym_affiliated', false, 4.5, 15,
   false, ARRAY[]::text[], false,
   '[{"name":"Georges T.","text":"After my knee surgery, Lara''s rehab program got me back to full strength.","date":"2025-11-10"}]'::jsonb),

  (t7_id, 'Ziad Saab', 'ziad.saab@demo.kotch', 'trainer',
   'Sidon', 'Saida', 'PowerHouse Gym Saida',
   'Competitive bodybuilder turned coach. Specializing in contest prep, bulking cycles, and serious muscle-building programs for dedicated trainees.',
   35, ARRAY['Bodybuilding', 'Strength Training', 'Weight Loss', 'Nutrition Coaching'], ARRAY['NSCA-CSCS', 'NASM-CNC'],
   9, 150, 34, 'male', 'gym_affiliated', false, 4.4, 22,
   true, ARRAY['Sidon', 'Tyre'], true,
   '[{"name":"Hassan K.","text":"Ziad knows bodybuilding inside out. My competition prep was flawless.","date":"2025-08-25"},{"name":"Omar D.","text":"Gained 8kg of lean muscle in 6 months under Ziad''s guidance.","date":"2025-10-12"}]'::jsonb),

  (t8_id, 'Sarah Daher', 'sarah.daher@demo.kotch', 'trainer',
   'Beirut', 'Downtown', 'Athletica BCD',
   'Holistic fitness coach combining strength training with nutrition and mindset coaching. Let me help you build the healthiest version of yourself.',
   55, ARRAY['Weight Loss', 'Functional Training', 'Yoga', 'Nutrition Coaching'], ARRAY['ACE-CPT', 'Precision Nutrition', 'NASM-CNC'],
   6, 75, 29, 'female', 'freelancer', true, 4.7, 20,
   true, ARRAY['Beirut', 'Metn', 'Kesserwan'], true,
   '[{"name":"Lea B.","text":"Sarah changed my relationship with food and exercise. Holistic approach works!","date":"2025-09-08"},{"name":"Tina M.","text":"Best investment I made. Sarah''s program is sustainable and effective.","date":"2025-11-28"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  user_role = EXCLUDED.user_role,
  city = EXCLUDED.city,
  area = EXCLUDED.area,
  gym = EXCLUDED.gym,
  bio_expert = EXCLUDED.bio_expert,
  hourly_rate = EXCLUDED.hourly_rate,
  specialty = EXCLUDED.specialty,
  certifications = EXCLUDED.certifications,
  years_experience = EXCLUDED.years_experience,
  clients_worked_with = EXCLUDED.clients_worked_with,
  age = EXCLUDED.age,
  gender = EXCLUDED.gender,
  trainer_type = EXCLUDED.trainer_type,
  verified_status = EXCLUDED.verified_status,
  rating_avg = EXCLUDED.rating_avg,
  total_reviews = EXCLUDED.total_reviews,
  offers_home_training = EXCLUDED.offers_home_training,
  home_training_cities = EXCLUDED.home_training_cities,
  offers_diet_plan = EXCLUDED.offers_diet_plan,
  testimonials = EXCLUDED.testimonials;

-- Add availability for each trainer
DELETE FROM public.availability WHERE user_id IN (t1_id, t2_id, t3_id, t4_id, t5_id, t6_id, t7_id, t8_id);

INSERT INTO public.availability (user_id, day, start_time, end_time) VALUES
  -- Karim: Mon-Fri mornings and evenings
  (t1_id, 'Monday', '08:00', '12:00'), (t1_id, 'Monday', '17:00', '21:00'),
  (t1_id, 'Tuesday', '08:00', '12:00'), (t1_id, 'Tuesday', '17:00', '21:00'),
  (t1_id, 'Wednesday', '08:00', '12:00'), (t1_id, 'Wednesday', '17:00', '21:00'),
  (t1_id, 'Thursday', '08:00', '12:00'), (t1_id, 'Thursday', '17:00', '21:00'),
  (t1_id, 'Friday', '08:00', '12:00'),
  (t1_id, 'Saturday', '08:00', '12:00'),

  -- Nour: Tue, Thu, Sat mornings + afternoons
  (t2_id, 'Tuesday', '08:00', '12:00'), (t2_id, 'Tuesday', '12:00', '17:00'),
  (t2_id, 'Thursday', '08:00', '12:00'), (t2_id, 'Thursday', '12:00', '17:00'),
  (t2_id, 'Saturday', '08:00', '12:00'), (t2_id, 'Saturday', '12:00', '17:00'),
  (t2_id, 'Sunday', '08:00', '12:00'),

  -- Rami: Mon-Sat early morning + evening
  (t3_id, 'Monday', '05:00', '08:00'), (t3_id, 'Monday', '17:00', '21:00'),
  (t3_id, 'Tuesday', '05:00', '08:00'), (t3_id, 'Tuesday', '17:00', '21:00'),
  (t3_id, 'Wednesday', '05:00', '08:00'), (t3_id, 'Wednesday', '17:00', '21:00'),
  (t3_id, 'Thursday', '05:00', '08:00'), (t3_id, 'Thursday', '17:00', '21:00'),
  (t3_id, 'Friday', '05:00', '08:00'), (t3_id, 'Friday', '17:00', '21:00'),
  (t3_id, 'Saturday', '05:00', '08:00'), (t3_id, 'Saturday', '08:00', '12:00'),

  -- Maya: flexible home trainer
  (t4_id, 'Monday', '08:00', '12:00'), (t4_id, 'Monday', '12:00', '17:00'),
  (t4_id, 'Wednesday', '08:00', '12:00'), (t4_id, 'Wednesday', '12:00', '17:00'),
  (t4_id, 'Friday', '08:00', '12:00'), (t4_id, 'Friday', '12:00', '17:00'),
  (t4_id, 'Sunday', '08:00', '12:00'),

  -- Tony: evenings only
  (t5_id, 'Monday', '17:00', '21:00'), (t5_id, 'Tuesday', '17:00', '21:00'),
  (t5_id, 'Wednesday', '17:00', '21:00'), (t5_id, 'Thursday', '17:00', '21:00'),
  (t5_id, 'Friday', '17:00', '21:00'), (t5_id, 'Saturday', '12:00', '17:00'),

  -- Lara: mornings
  (t6_id, 'Monday', '08:00', '12:00'), (t6_id, 'Tuesday', '08:00', '12:00'),
  (t6_id, 'Wednesday', '08:00', '12:00'), (t6_id, 'Thursday', '08:00', '12:00'),
  (t6_id, 'Friday', '08:00', '12:00'),

  -- Ziad: all day
  (t7_id, 'Monday', '08:00', '12:00'), (t7_id, 'Monday', '12:00', '17:00'), (t7_id, 'Monday', '17:00', '21:00'),
  (t7_id, 'Tuesday', '08:00', '12:00'), (t7_id, 'Tuesday', '12:00', '17:00'),
  (t7_id, 'Wednesday', '08:00', '12:00'), (t7_id, 'Wednesday', '12:00', '17:00'), (t7_id, 'Wednesday', '17:00', '21:00'),
  (t7_id, 'Thursday', '08:00', '12:00'), (t7_id, 'Thursday', '12:00', '17:00'),
  (t7_id, 'Friday', '08:00', '12:00'),
  (t7_id, 'Saturday', '08:00', '12:00'), (t7_id, 'Saturday', '12:00', '17:00'),

  -- Sarah: mornings + some evenings
  (t8_id, 'Monday', '08:00', '12:00'), (t8_id, 'Monday', '17:00', '21:00'),
  (t8_id, 'Tuesday', '08:00', '12:00'),
  (t8_id, 'Wednesday', '08:00', '12:00'), (t8_id, 'Wednesday', '17:00', '21:00'),
  (t8_id, 'Thursday', '08:00', '12:00'),
  (t8_id, 'Friday', '08:00', '12:00'), (t8_id, 'Friday', '17:00', '21:00'),
  (t8_id, 'Saturday', '08:00', '12:00');

-- Add training packages
DELETE FROM public.training_packages WHERE trainer_id IN (t1_id, t2_id, t3_id, t4_id, t5_id, t6_id, t7_id, t8_id);

INSERT INTO public.training_packages (trainer_id, title, duration_weeks, sessions_per_week, price_without_diet, price_with_diet, description) VALUES
  (t1_id, 'Starter Pack', 4, 3, 420, 520, 'Perfect for beginners. 12 sessions to build a foundation.'),
  (t1_id, '12-Week Transformation', 12, 4, 1500, 1900, 'Full body transformation program with progressive overload.'),
  (t2_id, 'Yoga Foundations', 4, 2, 240, 310, '8 sessions to learn proper form and breathing.'),
  (t2_id, 'Mind & Body Reset', 8, 3, 700, 900, 'Comprehensive program combining yoga, pilates, and nutrition.'),
  (t3_id, 'CrossFit Intro', 4, 3, 500, NULL, 'Learn the fundamentals of CrossFit in a safe environment.'),
  (t3_id, 'Athlete Performance', 12, 5, 2200, NULL, 'Serious athletic performance program for committed athletes.'),
  (t4_id, 'Quick Start', 4, 3, 300, 400, 'Kickstart your fitness journey with guided workouts and meal plans.'),
  (t4_id, 'Summer Ready', 8, 4, 750, 950, 'Get in shape for summer with training and customized nutrition.'),
  (t5_id, 'Boxing Fundamentals', 4, 3, 800, NULL, 'Learn boxing basics: stance, jabs, combos, and footwork.'),
  (t5_id, 'Executive Fitness', 8, 3, 1600, NULL, 'Premium 1-on-1 training tailored for busy professionals.'),
  (t7_id, 'Bulk Up', 8, 4, 900, 1100, 'Structured hypertrophy program with nutrition plan.'),
  (t7_id, 'Contest Prep', 16, 5, 2000, 2500, 'Complete competition preparation with posing and peak week.'),
  (t8_id, 'Wellness Kickstart', 4, 3, 560, 700, 'Holistic program: training + nutrition + mindset coaching.'),
  (t8_id, 'Total Transformation', 12, 4, 2000, 2500, 'Premium 12-week program with full support and accountability.');

END $$;
