# EduPulse Backend — Hackathon Implementation Plan

> **Target:** 24-hour delivery. Prioritize working features over perfect code.

---

## 1. Backend Folder Structure

```
AV26-141/
├── frontend/          ← existing React app (AV26-141/)
└── backend/           ← NEW — create this alongside frontend
    ├── .env
    ├── package.json
    ├── server.js                  ← Express entry point
    ├── supabase.js                ← Supabase client (service role key)
    ├── routes/
    │   ├── student.js             ← Student dashboard APIs
    │   ├── teacher.js             ← Teacher dashboard APIs
    │   ├── import.js              ← Excel import API
    │   └── alerts.js              ← Notification/alert APIs
    ├── controllers/
    │   ├── studentController.js
    │   ├── teacherController.js
    │   ├── importController.js
    │   └── alertController.js
    ├── middleware/
    │   └── auth.js                ← Verify Supabase JWT
    ├── services/
    │   ├── riskEngine.js          ← Risk score + notification logic
    │   ├── progressEngine.js      ← Progress bar calculation
    │   └── excelParser.js         ← xlsx parsing logic
    └── uploads/                   ← Temp folder for uploaded xlsx files
```

> **Init command:**
> ```bash
> mkdir backend && cd backend
> npm init -y
> npm install express cors dotenv @supabase/supabase-js multer xlsx
> ```

---

## 2. API Endpoints

### Student APIs (`/api/student`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | All data for student dashboard in one call |
| GET | `/api/student/grades` | All grades grouped by subject |
| GET | `/api/student/attendance` | Monthly attendance history |
| GET | `/api/student/assignments` | Assignment completion per subject |
| GET | `/api/student/progress` | Calculated progress score |
| GET | `/api/student/notifications` | Active warning notifications |

### Teacher APIs (`/api/teacher`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/dashboard` | Summary stats + at-risk count |
| GET | `/api/teacher/students` | Full student list with risk levels |
| GET | `/api/teacher/students/:studentId` | Single student detailed report |
| GET | `/api/teacher/at-risk` | Only at-risk + critical students |
| POST | `/api/teacher/alerts` | Create an alert for a student |
| PATCH | `/api/teacher/alerts/:alertId` | Mark alert reviewed, add note |

### Import APIs (`/api/import`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/excel` | Upload + parse `.xlsx`, insert all data |
| GET | `/api/import/template` | Download Excel template file |

### Alert APIs (`/api/alerts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | All alerts (teacher-scoped) |
| GET | `/api/alerts/unreviewed` | Only unreviewed alerts |
| PATCH | `/api/alerts/:id/review` | Mark reviewed + add follow-up |

---

## 3. Backend Setup Files

### `backend/.env`
```env
PORT=5000
SUPABASE_URL=https://jzzxmojzqghovcqihzya.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>   # NOT the anon key!
```

> ⚠️ **IMPORTANT:** Use the **Service Role Key** (from Supabase → Project Settings → API → service_role). This bypasses RLS so backend can read/write all rows. Never expose this on the frontend.

### `backend/supabase.js`
```js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
```

### `backend/server.js`
```js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import studentRoutes from './routes/student.js';
import teacherRoutes from './routes/teacher.js';
import importRoutes  from './routes/import.js';
import alertRoutes   from './routes/alerts.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/student',  studentRoutes);
app.use('/api/teacher',  teacherRoutes);
app.use('/api/import',   importRoutes);
app.use('/api/alerts',   alertRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`EduPulse API running on port ${process.env.PORT}`)
);
```

### `backend/middleware/auth.js`
```js
import { supabase } from '../supabase.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Fetch role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  req.user = { ...user, role: userData?.role, full_name: userData?.full_name };
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role)
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
```

---

## 4. Excel Import Flow

### Expected Excel Sheet Structure (one row per student)
| Column | Value |
|--------|-------|
| `name` | Student Full Name |
| `email` | Student Email (used as login) |
| `roll_no` | e.g. "CS001" |
| `class` | e.g. "10th" |
| `section` | e.g. "A" |
| `math_score` | 0–100 |
| `science_score` | 0–100 |
| `english_score` | 0–100 |
| `kannada_score` | 0–100 |
| `social_score` | 0–100 |
| `exam_type` | unit1 / unit2 / midterm / final |
| `exam_date` | YYYY-MM-DD |
| `attendance_total` | e.g. 30 |
| `attendance_present` | e.g. 25 |
| `assignments_total` | e.g. 10 |
| `assignments_submitted` | e.g. 8 |
| `month` | e.g. "2024-05" |

### `backend/services/excelParser.js`
```js
import XLSX from 'xlsx';

export function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet);
  return rows; // array of plain objects matching column headers
}
```

### `backend/routes/import.js` — Core Logic
```js
import express from 'express';
import multer  from 'multer';
import fs      from 'fs';
import { supabase }      from '../supabase.js';
import { parseExcel }    from '../services/excelParser.js';
import { calculateRisk } from '../services/riskEngine.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/excel', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    const rows = parseExcel(req.file.path);
    const results = [];

    for (const row of rows) {
      // 1. Create Supabase auth user (or get existing)
      const { data: authData } = await supabase.auth.admin.createUser({
        email: row.email,
        password: 'EduPulse@123',  // default password, student changes on first login
        email_confirm: true,
      });
      const userId = authData?.user?.id;

      // 2. Upsert users table
      await supabase.from('users').upsert({
        id: userId,
        email: row.email,
        full_name: row.name,
        role: 'student',
      });

      // 3. Upsert students table
      const { data: studentData } = await supabase
        .from('students')
        .upsert({ user_id: userId, roll_no: row.roll_no, class: row.class, section: row.section })
        .select('id')
        .single();
      const studentId = studentData.id;

      // 4. Insert grades (one row per subject)
      const subjects = [
        { subject: 'mathematics',   score: row.math_score },
        { subject: 'science',       score: row.science_score },
        { subject: 'english',       score: row.english_score },
        { subject: 'kannada',       score: row.kannada_score },
        { subject: 'social_science',score: row.social_score },
      ];
      await supabase.from('grades').insert(
        subjects.map(s => ({ student_id: studentId, ...s,
          exam_type: row.exam_type, exam_date: row.exam_date }))
      );

      // 5. Upsert attendance
      await supabase.from('attendance').upsert({
        student_id: studentId, month: row.month,
        total_days: row.attendance_total, present_days: row.attendance_present,
      });

      // 6. Upsert assignments (one row per subject)
      for (const s of subjects) {
        await supabase.from('assignments').upsert({
          student_id: studentId, subject: s.subject, month: row.month,
          total_assigned: row.assignments_total,
          submitted: row.assignments_submitted,
        });
      }

      // 7. Calculate + save risk score
      const avgGrade = subjects.reduce((sum, s) => sum + Number(s.score), 0) / subjects.length;
      const attendancePct = (row.attendance_present / row.attendance_total) * 100;
      const assignmentPct = (row.assignments_submitted / row.assignments_total) * 100;
      const risk = calculateRisk(attendancePct, avgGrade, assignmentPct);

      await supabase.from('risk_scores').upsert({
        student_id: studentId,
        score: risk.score,
        risk_level: risk.level,
        attendance_score: attendancePct,
        grade_score: avgGrade,
        assignment_score: assignmentPct,
      });

      // 8. Auto-create alerts for at-risk/critical
      if (risk.level !== 'safe') {
        await supabase.from('alerts').insert({
          student_id: studentId,
          teacher_id: req.user.id,
          message: buildAlertMessage(row.name, risk, subjects, attendancePct),
          risk_level: risk.level,
        });
      }

      results.push({ email: row.email, risk: risk.level, status: 'ok' });
    }

    fs.unlinkSync(req.file.path); // cleanup temp file
    res.json({ imported: results.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function buildAlertMessage(name, risk, subjects, attendance) {
  const lowSubjects = subjects
    .filter(s => s.score < 35)
    .map(s => s.subject.replace('_', ' '));
  const parts = [];
  if (lowSubjects.length) parts.push(`Low scores in: ${lowSubjects.join(', ')}`);
  if (attendance < 75)    parts.push(`Attendance at ${attendance.toFixed(1)}%`);
  return `${name} needs attention — ${parts.join('; ')}`;
}

export default router;
```

---

## 5. Risk Score & Notification Engine

### `backend/services/riskEngine.js`
```js
/**
 * Risk Score = (Attendance × 0.35) + (Grade Avg × 0.40) + (Assignment % × 0.25)
 * 75–100 → safe | 50–74 → at_risk | 0–49 → critical
 */
export function calculateRisk(attendancePct, gradeAvg, assignmentPct) {
  const score =
    (attendancePct  * 0.35) +
    (gradeAvg       * 0.40) +
    (assignmentPct  * 0.25);

  const level =
    score >= 75 ? 'safe' :
    score >= 50 ? 'at_risk' : 'critical';

  return { score: Math.round(score * 100) / 100, level };
}

/**
 * Notification triggers for Student Dashboard
 * Returns array of warning strings (empty = no warnings)
 */
export function buildStudentNotifications(grades, attendancePct, avgMarks) {
  const warnings = [];

  if (avgMarks < 35)
    warnings.push(`⚠️ Your overall average (${avgMarks.toFixed(1)}%) is below the 35% pass mark.`);

  if (attendancePct < 75)
    warnings.push(`⚠️ Your attendance (${attendancePct.toFixed(1)}%) is below the required 75%.`);

  for (const g of grades) {
    if (g.score < 35)
      warnings.push(`⚠️ Your score in ${g.subject.replace('_',' ')} (${g.score}%) is below 35%.`);
  }

  return warnings;
}
```

---

## 6. Progress Bar Calculation

### `backend/services/progressEngine.js`
```js
/**
 * Progress = (avg_marks × 0.5) + (attendance × 0.3) + (assignment_completion × 0.2)
 * Result: 0–100
 */
export function calculateProgress(avgMarks, attendancePct, assignmentPct) {
  const progress =
    (avgMarks      * 0.5) +
    (attendancePct * 0.3) +
    (assignmentPct * 0.2);

  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}
```

---

## 7. Key Supabase Queries

### Student Dashboard — single fetch
```js
// In studentController.js
export async function getStudentDashboard(req, res) {
  const userId = req.user.id;

  // Get student profile
  const { data: student } = await supabase
    .from('students')
    .select('id, roll_no, class, section')
    .eq('user_id', userId)
    .single();

  const sid = student.id;

  // Parallel fetch for speed
  const [gradesRes, attendanceRes, assignmentsRes, riskRes] = await Promise.all([
    supabase.from('grades').select('*').eq('student_id', sid),
    supabase.from('attendance').select('*').eq('student_id', sid).order('month', { ascending: false }),
    supabase.from('assignments').select('*').eq('student_id', sid),
    supabase.from('risk_scores').select('*').eq('student_id', sid)
      .order('calculated_at', { ascending: false }).limit(1).single(),
  ]);

  const grades      = gradesRes.data ?? [];
  const attendance  = attendanceRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const risk        = riskRes.data;

  // Calculate derived values
  const avgMarks = grades.reduce((s, g) => s + g.score, 0) / (grades.length || 1);
  const latestAttendance = attendance[0]?.percentage ?? 0;
  const avgAssignment = assignments.reduce((s, a) => s + a.completion_rate, 0) / (assignments.length || 1);

  const progress      = calculateProgress(avgMarks, latestAttendance, avgAssignment);
  const notifications = buildStudentNotifications(grades, latestAttendance, avgMarks);

  res.json({
    student,
    grades,
    attendance,
    assignments,
    risk,
    summary: {
      avgMarks: Math.round(avgMarks * 10) / 10,
      attendancePct: latestAttendance,
      assignmentPct: Math.round(avgAssignment * 10) / 10,
      progress,
      notifications,
    },
  });
}
```

### Teacher — All Students with Risk
```js
// One query to get all students with their latest risk score
const { data } = await supabase
  .from('students')
  .select(`
    id, roll_no, class, section,
    users!user_id ( full_name, email ),
    risk_scores (
      score, risk_level, calculated_at
    )
  `)
  .order('roll_no');
```

### Teacher — At-Risk Students Only
```js
const { data } = await supabase
  .from('risk_scores')
  .select(`
    score, risk_level, calculated_at,
    students (
      id, roll_no, class, section,
      users!user_id ( full_name, email )
    )
  `)
  .in('risk_level', ['at_risk', 'critical'])
  .order('score', { ascending: true }); // worst first
```

---

## 8. Frontend Integration (How to Call the Backend)

### In your React pages — use the Supabase session token:
```js
// src/lib/api.js  ← create this helper
import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL; // http://localhost:5000

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Example usage in StudentDashboard.jsx:
```js
const [data, setData] = useState(null);

useEffect(() => {
  apiFetch('/api/student/dashboard').then(setData);
}, []);
```

---

## 9. Implementation Order (24-Hour Hackathon)

```
PHASE 1 — Backend Foundation (2–3 hrs)          ✅ First
├── Create backend/ folder & package.json
├── server.js (Express + CORS + routes)
├── supabase.js (service role client)
├── middleware/auth.js (JWT verification)
└── .env with service role key

PHASE 2 — Excel Import (3–4 hrs)               ✅ Second
├── services/excelParser.js
├── services/riskEngine.js (calculateRisk)
├── routes/import.js (upload + parse + insert)
└── Test with a sample .xlsx file

PHASE 3 — Teacher Dashboard (2–3 hrs)          ✅ Third
├── routes/teacher.js + teacherController.js
│   ├── GET /api/teacher/students
│   ├── GET /api/teacher/at-risk
│   └── GET /api/teacher/students/:id
├── TeacherDashboard.jsx — student list table
├── StudentList.jsx — at-risk highlighted rows
└── Alerts.jsx — alert list + mark reviewed

PHASE 4 — Student Dashboard (2–3 hrs)          ✅ Fourth
├── routes/student.js + studentController.js
│   └── GET /api/student/dashboard (all-in-one)
├── services/progressEngine.js
├── StudentDashboard.jsx — progress bar + notifs
├── MyGrades.jsx — Recharts bar chart
└── MyAttendance.jsx — monthly attendance chart

PHASE 5 — Polish (1–2 hrs)                     ✅ Last
├── Error handling & loading states
├── Empty states (no data yet)
├── Excel template download endpoint
└── Final demo flow test
```

---

## 10. Quick Reference — Risk + Progress Formulas

```
Risk Score   = (Attendance% × 0.35) + (Grade Avg × 0.40) + (Assignment% × 0.25)
  → 75–100   = 🟢 Safe
  → 50–74    = 🟡 At Risk
  →  0–49    = 🔴 Critical

Progress     = (Avg Marks × 0.50) + (Attendance% × 0.30) + (Assignment% × 0.20)
  → 0–100 displayed as progress bar on student dashboard

Notification triggers (student sees these automatically):
  → Overall avg < 35%         ⚠️ warning
  → Any single subject < 35%  ⚠️ warning (per subject)
  → Attendance < 75%          ⚠️ warning
```

---

> [!IMPORTANT]
> Get the **Service Role Key** from Supabase → Project Settings → API → `service_role` secret. This is NOT the anon key. Without it the backend cannot bypass RLS to write to all tables.

> [!TIP]
> For the hackathon, skip writing individual endpoints for grades/attendance/assignments separately. Use the **single `/api/student/dashboard`** endpoint that returns everything in one `Promise.all` call — much faster to demo.

> [!WARNING]
> The `supabase.auth.admin.createUser()` call in the Excel import requires the **service role key**. If students already have accounts (registered via signup), use `getUserByEmail` first and skip creation to avoid duplicate user errors.
