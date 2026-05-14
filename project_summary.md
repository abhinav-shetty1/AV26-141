# EduPulse — Full Project Summary

> **Copy-paste this entire document into another AI agent to give it full context about your project.**

---

## 1. What Is EduPulse?

**EduPulse** is a **Learning Analytics & Student Performance Prediction** web application. It is designed for schools/colleges and serves two user roles:

- **Teachers** — view class-wide analytics, monitor individual students, see risk scores, and manage alerts for at-risk students.
- **Students** — view their own personal dashboard, grades, and attendance data.

The core idea is to aggregate a student's grades, attendance, and assignment completion data, compute a **risk score** (safe / at_risk / critical), and surface **alerts** to teachers so they can intervene early for struggling students.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (Vite 8, JSX) |
| **Routing** | React Router DOM v7 |
| **State Management** | Zustand v5 |
| **Styling** | TailwindCSS v3 |
| **Backend / Database** | Supabase (PostgreSQL + Auth + RLS) |
| **Charts** | Recharts v3 (installed, not yet used) |
| **HTTP Client** | Axios (installed, not yet used) |
| **Planned Backend** | Node.js API at `http://localhost:5000` (referenced in `.env` as `VITE_API_URL`, not yet built) |

---

## 3. Directory Structure

```
AV26-141/
├── .env                          # Supabase URL, Anon Key, API URL
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite config
├── tailwind.config.js            # Tailwind config
├── postcss.config.js             # PostCSS config
├── supabase/
│   └── schema.sql                # Full database schema (7 tables + RLS policies)
└── src/
    ├── main.jsx                  # React entry point (renders <App />)
    ├── App.jsx                   # Root component — routing, theme, layout
    ├── App.css                   # Default Vite CSS (mostly unused)
    ├── index.css                 # Tailwind directives
    ├── lib/
    │   └── supabase.js           # Supabase client initialization
    ├── store/
    │   └── authStore.js          # Zustand auth store (user, role, login/logout)
    ├── components/
    │   └── layout/
    │       ├── Sidebar.jsx       # ✅ FULLY BUILT — collapsible sidebar with role-based nav
    │       └── ProtectedRoute.jsx # ✅ FULLY BUILT — role-based route guard
    └── pages/
        ├── auth/
        │   ├── Login.jsx         # ✅ FULLY BUILT — email/password login
        │   └── Signup.jsx        # ✅ FULLY BUILT — signup with role selection (teacher/student)
        ├── teacher/
        │   ├── TeacherDashboard.jsx  # ⬜ STUB — "Coming Soon" placeholder
        │   ├── StudentList.jsx       # ⬜ STUB — "Coming Soon" placeholder
        │   └── Alerts.jsx            # ⬜ STUB — "Coming Soon" placeholder
        └── student/
            ├── StudentDashboard.jsx  # ⬜ STUB — "Coming Soon" placeholder
            ├── MyGrades.jsx          # ⬜ STUB — "Coming Soon" placeholder
            └── MyAttendance.jsx      # ⬜ STUB — "Coming Soon" placeholder
```

---

## 4. Database Schema (Supabase PostgreSQL)

There are **7 tables** defined in `supabase/schema.sql`:

### `public.users`
Extends Supabase `auth.users`. Stores role and display name.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | References `auth.users(id)`, cascade delete |
| email | text | Not null |
| full_name | text | Nullable |
| role | text | `'teacher'` or `'student'` (check constraint) |
| created_at | timestamptz | Default `now()` |

### `public.students`
Academic profile linked to a user.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | → `users(id)` |
| roll_no | text | Unique |
| class | text | e.g. "10th" |
| section | text | e.g. "A" |
| created_at | timestamptz | |

### `public.grades`
Per-subject, per-exam scores.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK) | → `students(id)` |
| subject | text | One of: `mathematics`, `science`, `english`, `kannada`, `social_science` |
| score | numeric(5,2) | 0–100 |
| exam_type | text | `unit1`, `unit2`, `midterm`, `final` |
| exam_date | date | |

### `public.attendance`
Monthly attendance summary.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK) | → `students(id)` |
| month | text | e.g. `'2024-01'` |
| total_days | integer | |
| present_days | integer | |
| percentage | numeric(5,2) | **Generated column**: `(present_days / total_days) * 100` |
| Unique constraint | | `(student_id, month)` |

### `public.assignments`
Per-subject assignment completion.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK) | → `students(id)` |
| subject | text | Same 5 subjects as grades |
| total_assigned | integer | |
| submitted | integer | |
| completion_rate | numeric(5,2) | **Generated column**: `(submitted / total_assigned) * 100` |
| month | text | |
| Unique constraint | | `(student_id, subject, month)` |

### `public.risk_scores`
Calculated risk score per student (intended to be computed by a backend Node.js service).
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK) | → `students(id)` |
| score | numeric(5,2) | Overall risk score |
| risk_level | text | `safe`, `at_risk`, or `critical` |
| attendance_score | numeric(5,2) | Component score |
| grade_score | numeric(5,2) | Component score |
| assignment_score | numeric(5,2) | Component score |
| calculated_at | timestamptz | |

### `public.alerts`
Teacher notifications about at-risk students.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK) | → `students(id)` |
| teacher_id | uuid (FK) | → `users(id)` |
| message | text | Alert description |
| risk_level | text | `at_risk` or `critical` |
| reviewed | boolean | Default `false` |
| note | text | Teacher's notes |
| follow_up_date | date | |

### Row-Level Security (RLS)
All 7 tables have RLS enabled with these policies:
- **Users**: can only read their own profile.
- **Students**: teachers can read all student records; students can only read their own.
- **Grades**: teachers can read all; students can only read their own.
- **Attendance**: same as grades.
- **Alerts**: teachers have full CRUD access.

---

## 5. Authentication Flow

1. **Signup** (`/auth/signup`) — User picks role (teacher/student), enters name, email, password. Calls `supabase.auth.signUp()`, then inserts a row into `public.users` with their role. Redirects to login.
2. **Login** (`/auth/login`) — Email/password login via `supabase.auth.signInWithPassword()`. After login, fetches the user's role from the `users` table and redirects to `/teacher/dashboard` or `/student/dashboard`.
3. **Session Persistence** — On app load, `authStore.initialize()` calls `supabase.auth.getSession()` and also listens for auth state changes via `onAuthStateChange`.
4. **Route Protection** — `<ProtectedRoute allowedRole="teacher|student">` checks if the user is logged in and has the correct role. Redirects unauthenticated users to login, and wrong-role users to their own dashboard.

---

## 6. State Management (Zustand)

Single store: `authStore.js`

```
State:
  - user: null | Supabase auth user object
  - role: null | "teacher" | "student"
  - loading: true | false

Actions:
  - initialize()   → restores session from Supabase, sets up auth listener
  - setUser(user, role)
  - clearUser()
  - logout()        → calls supabase.auth.signOut()
```

---

## 7. Routing Structure

| Path | Component | Role Required |
|---|---|---|
| `/` | Redirect → `/auth/login` | Public |
| `/auth/login` | Login | Public |
| `/auth/signup` | Signup | Public |
| `/teacher/dashboard` | TeacherDashboard | teacher |
| `/teacher/students` | StudentList | teacher |
| `/teacher/alerts` | Alerts | teacher |
| `/student/dashboard` | StudentDashboard | student |
| `/student/grades` | MyGrades | student |
| `/student/attendance` | MyAttendance | student |

All authenticated routes are wrapped in `<ProtectedRoute>` and rendered inside `<AppLayout>` which provides the sidebar + main content area.

---

## 8. UI/UX Details

- **Theme**: Dark mode by default (gray-950 background), with light mode toggle. Theme state stored in `localStorage` under key `ep-theme`.
- **Sidebar**: Collapsible, shows role badge ("Teacher Portal" / "Student Portal"), navigation links with SVG icons, theme toggle, user email avatar, and logout button.
- **Design system**: TailwindCSS with indigo-600 as primary accent color. Dark cards use `bg-gray-900 border-gray-800`. Inputs use `bg-gray-800 border-gray-700`.
- **Login/Signup pages**: Centered card layout with subtle grid background pattern.

---

## 9. Current Status — What's Built vs. What's a Stub

### ✅ Fully Built
- Supabase client setup and `.env` configuration
- Full database schema with 7 tables and RLS policies
- Authentication (Login + Signup + session persistence)
- Zustand auth store
- Protected route guard (role-based)
- Sidebar with role-based navigation and theme toggle
- App routing structure

### ⬜ Stubs (Placeholder "Coming Soon" pages)
- **TeacherDashboard** — needs class overview stats, charts, at-risk student summary
- **StudentList** — needs table of all students with search/filter, risk indicators
- **Alerts** — needs list of alerts, mark-as-reviewed, add notes, follow-up dates
- **StudentDashboard** — needs personal overview: GPA, attendance %, risk level
- **MyGrades** — needs per-subject grades table/chart across exam types
- **MyAttendance** — needs monthly attendance history chart/table

### ⬜ Not Yet Built
- **Node.js backend** (`VITE_API_URL=http://localhost:5000`) — intended to calculate risk scores
- **Risk score calculation algorithm** — combining attendance, grades, and assignment scores
- **Data seeding** — no sample data exists yet
- **Student profile creation flow** — after signup as student, no UI to create the `students` record (roll_no, class, section)
- **Teacher CRUD operations** — no UI for teachers to input grades, attendance, or assignments
- **Recharts integration** — library is installed but no charts are implemented yet

---

## 10. Environment Variables

```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-publishable-key>
VITE_API_URL=http://localhost:5000   # Planned Node.js backend
```

---

## 11. How to Run

```bash
npm install
npm run dev     # Starts Vite dev server (default: http://localhost:5173)
```

---

## 12. Key Patterns & Conventions

- **File naming**: PascalCase for React components (e.g., `TeacherDashboard.jsx`), camelCase for stores/libs
- **Folder structure**: Feature-based under `pages/` (auth, teacher, student), shared components under `components/layout/`
- **Supabase client**: Single instance exported from `src/lib/supabase.js`, used directly in components and stores
- **Theme prop**: `theme` ("dark" | "light") is passed as a prop from `App` → `AppLayout` → all page components for conditional styling
- **TailwindCSS**: Used for all styling; no custom CSS is used for app pages (App.css is leftover Vite boilerplate)
