-- ============================================
-- EduPulse Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text check (role in ('teacher', 'student')) not null default 'student',
  created_at timestamp with time zone default now()
);

-- 2. STUDENTS (academic profile)
create table public.students (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  roll_no text unique not null,
  class text not null,
  section text not null,
  created_at timestamp with time zone default now()
);

-- 3. GRADES (per subject per exam)
create table public.grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  subject text check (subject in ('mathematics','science','english','kannada','social_science')) not null,
  score numeric(5,2) check (score >= 0 and score <= 100) not null,
  exam_type text check (exam_type in ('unit1','unit2','midterm','final')) not null,
  exam_date date not null,
  created_at timestamp with time zone default now()
);

-- 4. ATTENDANCE (monthly summary)
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  month text not null,          -- e.g. '2024-01'
  total_days integer not null,
  present_days integer not null,
  percentage numeric(5,2) generated always as (
    round((present_days::numeric / total_days) * 100, 2)
  ) stored,
  created_at timestamp with time zone default now(),
  unique(student_id, month)
);

-- 5. ASSIGNMENTS (per subject)
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  subject text check (subject in ('mathematics','science','english','kannada','social_science')) not null,
  total_assigned integer not null,
  submitted integer not null,
  completion_rate numeric(5,2) generated always as (
    round((submitted::numeric / total_assigned) * 100, 2)
  ) stored,
  month text not null,
  created_at timestamp with time zone default now(),
  unique(student_id, subject, month)
);

-- 6. RISK SCORES (calculated by Node.js backend)
create table public.risk_scores (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  score numeric(5,2) not null,
  risk_level text check (risk_level in ('safe','at_risk','critical')) not null,
  attendance_score numeric(5,2),
  grade_score numeric(5,2),
  assignment_score numeric(5,2),
  calculated_at timestamp with time zone default now()
);

-- 7. ALERTS (teacher notifications)
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.users(id),
  message text not null,
  risk_level text check (risk_level in ('at_risk','critical')) not null,
  reviewed boolean default false,
  note text,
  follow_up_date date,
  created_at timestamp with time zone default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.grades enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.risk_scores enable row level security;
alter table public.alerts enable row level security;

-- Users can read their own profile
create policy "users_read_own" on public.users
  for select using (auth.uid() = id);

-- Teachers can read all students
create policy "teachers_read_students" on public.students
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'teacher')
  );

-- Students can read only their own student record
create policy "students_read_own" on public.students
  for select using (user_id = auth.uid());

-- Teachers can read all grades
create policy "teachers_read_grades" on public.grades
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'teacher')
  );

-- Students can read their own grades
create policy "students_read_own_grades" on public.grades
  for select using (
    exists (select 1 from public.students where id = student_id and user_id = auth.uid())
  );

-- Same pattern for attendance, assignments, risk_scores, alerts
create policy "teachers_read_attendance" on public.attendance
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'teacher')
  );

create policy "students_read_own_attendance" on public.attendance
  for select using (
    exists (select 1 from public.students where id = student_id and user_id = auth.uid())
  );

create policy "teachers_full_alerts" on public.alerts
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'teacher')
  );
