const router  = require('express').Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabase }          = require('../supabase');
const { parseExcel }        = require('../services/excelParser');
const { calculateRisk, buildAlertMessage } = require('../services/riskEngine');

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// POST /api/import/excel
router.post(
  '/excel',
  requireAuth,
  requireRole('teacher'),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const results = [];
    const errors  = [];

    try {
      const rows = parseExcel(req.file.path);

      for (const row of rows) {
        try {
          const email   = (row.email   || '').trim();
          const name    = (row.name    || row.full_name || '').trim();
          const roll_no = (row.roll_no || '').trim();

          if (!email) { errors.push({ row, reason: 'Missing email' }); continue; }

          // ── 1. Create or fetch auth user ─────────────────────
          let userId;
          const { data: created, error: createErr } =
            await supabase.auth.admin.createUser({
              email,
              password:       'EduPulse@123',
              email_confirm:  true,
            });

          if (createErr) {
            // User already exists — fetch from public.users
            const { data: existing } = await supabase
              .from('users').select('id').eq('email', email).single();
            if (!existing) { errors.push({ email, reason: createErr.message }); continue; }
            userId = existing.id;
          } else {
            userId = created.user.id;
          }

          // ── 2. Upsert public.users ────────────────────────────
          await supabase.from('users').upsert({
            id: userId, email, full_name: name, role: 'student',
          });

          // ── 3. Upsert students ────────────────────────────────
          const { data: studentRow, error: sErr } = await supabase
            .from('students')
            .upsert(
              { user_id: userId, roll_no, class: row.class || '', section: row.section || '' },
              { onConflict: 'roll_no' }
            )
            .select('id')
            .single();

          if (sErr) { errors.push({ email, reason: sErr.message }); continue; }
          const studentId = studentRow.id;

          // ── 4. Build subject score list ───────────────────────
          const subjects = [
            { subject: 'mathematics',    score: Number(row.math_score    || row.mathematics    || 0) },
            { subject: 'science',         score: Number(row.science_score  || row.science        || 0) },
            { subject: 'english',         score: Number(row.english_score  || row.english        || 0) },
            { subject: 'kannada',         score: Number(row.kannada_score  || row.kannada        || 0) },
            { subject: 'social_science',  score: Number(row.social_score   || row.social_science || 0) },
          ];

          const examType  = row.exam_type  || 'unit1';
          const examDate  = row.exam_date  || new Date().toISOString().split('T')[0];
          const month     = row.month      || examDate.slice(0, 7); // YYYY-MM

          // ── 5. Upsert grades (prevent duplicates) ──────────────────────────
          await supabase.from('grades').upsert(
            subjects.map(s => ({
              student_id: studentId,
              subject:    s.subject,
              score:      s.score,
              exam_type:  examType,
              exam_date:  examDate,
            })),
            { onConflict: 'student_id,subject,exam_type' }
          );

          // ── 6. Upsert attendance ──────────────────────────────
          const totalDays   = Number(row.attendance_total   || 30);
          const presentDays = Number(row.attendance_present || 0);
          await supabase.from('attendance').upsert({
            student_id:   studentId,
            month,
            total_days:   totalDays,
            present_days: presentDays,
          }, { onConflict: 'student_id,month' });

          // ── 7. Upsert assignments ─────────────────────────────
          const totalAssigned = Number(row.assignments_total     || 10);
          const submitted     = Number(row.assignments_submitted || 0);
          for (const s of subjects) {
            await supabase.from('assignments').upsert({
              student_id:     studentId,
              subject:        s.subject,
              month,
              total_assigned: totalAssigned,
              submitted,
            }, { onConflict: 'student_id,subject,month' });
          }

          // ── 8. Calculate risk + upsert risk_scores ────────────
          const avgGrade      = subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length;
          const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          const assignmentPct = totalAssigned > 0 ? (submitted / totalAssigned) * 100 : 0;
          const risk          = calculateRisk(attendancePct, avgGrade, assignmentPct);

          await supabase.from('risk_scores').insert({
            student_id:       studentId,
            score:            risk.score,
            risk_level:       risk.level,
            attendance_score: attendancePct,
            grade_score:      avgGrade,
            assignment_score: assignmentPct,
          });

          // ── 9. Auto-create alert if at_risk or critical ───────
          if (risk.level !== 'safe') {
            const message = buildAlertMessage(name, risk, subjects, attendancePct);
            await supabase.from('alerts').insert({
              student_id: studentId,
              teacher_id: req.user.id,
              message,
              risk_level: risk.level,
            });
          }

          results.push({ email, name, risk: risk.level, status: 'imported' });
        } catch (rowErr) {
          errors.push({ row, reason: rowErr.message });
        }
      }

      // Cleanup uploaded file
      fs.unlink(req.file.path, () => {});

      res.json({
        total:    rows.length,
        imported: results.length,
        failed:   errors.length,
        results,
        errors,
      });
    } catch (err) {
      fs.unlink(req.file?.path, () => {});
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/import/template  — download the Excel column guide
router.get('/template', requireAuth, requireRole('teacher'), (_req, res) => {
  res.json({
    columns: [
      'name', 'email', 'roll_no', 'class', 'section',
      'math_score', 'science_score', 'english_score', 'kannada_score', 'social_score',
      'exam_type (unit1|unit2|midterm|final)', 'exam_date (YYYY-MM-DD)',
      'attendance_total', 'attendance_present',
      'assignments_total', 'assignments_submitted',
      'month (YYYY-MM)',
    ],
    notes: 'Default student password is EduPulse@123',
  });
});

module.exports = router;
