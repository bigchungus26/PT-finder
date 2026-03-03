-- ============================================================
-- LAU-Only Pivot: Seed LAU course catalog and update defaults
-- ============================================================

-- Update default school to LAU Beirut
alter table public.profiles
  alter column school set default 'LAU Beirut';

-- Seed LAU courses (upsert by code to avoid duplicates)
insert into public.courses (id, code, title, description) values
  (gen_random_uuid(), 'CSC201', 'Computer Applications', 'Introduction to computer applications and tools'),
  (gen_random_uuid(), 'CSC243', 'Intro to Object-Oriented Programming', 'Fundamentals of OOP using Java/Python'),
  (gen_random_uuid(), 'CSC245', 'Objects and Data Abstraction', 'Data structures and abstraction concepts'),
  (gen_random_uuid(), 'CSC310', 'Algorithms and Data Structures', 'Algorithm design, analysis, and implementation'),
  (gen_random_uuid(), 'CSC320', 'Computer Organization', 'Hardware architecture and low-level programming'),
  (gen_random_uuid(), 'CSC340', 'Database Systems', 'Relational databases, SQL, and design'),
  (gen_random_uuid(), 'CSC375', 'Operating Systems', 'Process management, memory, file systems'),
  (gen_random_uuid(), 'MTH101', 'Calculus I', 'Limits, derivatives, and integrals'),
  (gen_random_uuid(), 'MTH201', 'Calculus III', 'Multivariable calculus'),
  (gen_random_uuid(), 'MTH207', 'Linear Algebra', 'Vectors, matrices, and linear transformations'),
  (gen_random_uuid(), 'MTH301', 'Probability and Statistics', 'Probability theory and statistical methods'),
  (gen_random_uuid(), 'PHY211', 'General Physics II', 'Electricity, magnetism, and optics'),
  (gen_random_uuid(), 'PHY201', 'General Physics I', 'Mechanics, waves, and thermodynamics'),
  (gen_random_uuid(), 'BIO201', 'General Biology II', 'Cell biology and genetics'),
  (gen_random_uuid(), 'BIO301', 'Biochemistry', 'Chemistry of biological molecules'),
  (gen_random_uuid(), 'CHM201', 'General Chemistry II', 'Chemical equilibrium, acids/bases, electrochemistry'),
  (gen_random_uuid(), 'CHM301', 'Organic Chemistry I', 'Structure and reactivity of organic compounds'),
  (gen_random_uuid(), 'ENG201', 'Academic English II', 'Advanced academic writing and research'),
  (gen_random_uuid(), 'ENG202', 'Advanced Academic English', 'Critical reading and analytical writing'),
  (gen_random_uuid(), 'ECO201', 'Principles of Microeconomics', 'Supply, demand, and market structures'),
  (gen_random_uuid(), 'ECO202', 'Principles of Macroeconomics', 'National income, inflation, and monetary policy'),
  (gen_random_uuid(), 'ACC201', 'Principles of Accounting I', 'Financial accounting fundamentals'),
  (gen_random_uuid(), 'ACC202', 'Principles of Accounting II', 'Managerial accounting'),
  (gen_random_uuid(), 'BUS201', 'Principles of Management', 'Management theory and organizational behavior'),
  (gen_random_uuid(), 'BUS301', 'Marketing Principles', 'Marketing strategy and consumer behavior'),
  (gen_random_uuid(), 'FIN301', 'Financial Management', 'Corporate finance and investment'),
  (gen_random_uuid(), 'NUR201', 'Fundamentals of Nursing', 'Basic nursing concepts and skills'),
  (gen_random_uuid(), 'PHR201', 'Pharmaceutical Chemistry', 'Drug chemistry and pharmacology basics'),
  (gen_random_uuid(), 'ARC201', 'Architectural Design I', 'Fundamentals of architectural design'),
  (gen_random_uuid(), 'GRD201', 'Graphic Design Fundamentals', 'Visual communication and design principles'),
  (gen_random_uuid(), 'COM201', 'Introduction to Communication', 'Media, culture, and communication theory'),
  (gen_random_uuid(), 'CEE201', 'Statics', 'Forces, moments, and equilibrium in structures'),
  (gen_random_uuid(), 'MEE201', 'Thermodynamics', 'Laws of thermodynamics and applications'),
  (gen_random_uuid(), 'ELE201', 'Circuit Analysis', 'DC and AC circuit fundamentals')
on conflict (code) do nothing;
