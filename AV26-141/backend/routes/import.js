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
      console.log(`Processing ${rows.length} rows...`);

      for (const row of rows) {
        console.log('Current Row:', row);
        try {
          const email   = (row.email   || '').trim();
          const name    = (row.name    || row.full_name || '').trim();
          const roll_no = (row.roll_no || '').trim();

          if (!email) { 
            console.log('Skipping row: Missing email');
            errors.push({ row, reason: 'Missing email' }); 
            continue; 
          }

          // ── 1. Create or fetch auth user ─────────────────────
          let userId;
          const { data: created, error: createErr } =
            await supabase.auth.admin.createUser({
              email,
              password:       'EduPulse@123',
              email_confirm:  true,
            });

          if (createErr) {
            // If user exists, we need their ID. 
            // We search for them in the Auth system directly if possible, or try to get it from the error.
            // For now, let's try a direct search in public.users, 
            // but if they are missing there, we use a special fetch.
            const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
            
            if (existing) {
                userId = existing.id;
            } else {
                // If they exist in Auth but not in public.users, we need to find their ID from Auth
                const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
                const authUser = users.find(u => u.email === email);
                if (authUser) {
                    userId = authUser.id;
                } else {
                    errors.push({ email, reason: 'Auth conflict but ID not found.' });
                    continue;
                }
            }
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
            { subject: 'mathematics',    score: Number(row.math_score || row.maths || row.mathematics || 0) },
            { subject: 'science',        score: Number(row.science_score || row.science || row.sci || 0) },
            { subject: 'english',        score: Number(row.english_score || row.english || row.eng || 0) },
            { subject: 'kannada',        score: Number(row.kannada_score || row.kannada || row.kan || 0) },
            { subject: 'social_science', score: Number(row.social_score || row.social_sci || row.social_science || row.social || 0) },
          ];

          const examType  = row.exam_type  || 'midterm';
          const examDate  = row.exam_date  || new Date().toISOString().split('T')[0];
          const month     = row.month      || examDate.slice(0, 7);

          // ── 5. Upsert grades ──────────────────────────────────
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
          const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 0; // for risk calculation

          await supabase.from('attendance').upsert({
            student_id:   studentId,
            month,
            total_days:   totalDays,
            present_days: presentDays,
            // percentage is generated, do not insert
          }, { onConflict: 'student_id,month' });

          // ── 7. Upsert assignments ─────────────────────────────
          const totalAssigned = Number(row.assignments_total     || 10);
          const submitted     = Number(row.assignments_submitted || 0);
          const assignmentPct = totalAssigned > 0 ? (submitted / totalAssigned) * 100 : 0;

          for (const s of subjects) {
            await supabase.from('assignments').upsert({
              student_id:     studentId,
              subject:        s.subject,
              month,
              total_assigned: totalAssigned,
              submitted,
              // completion_rate is generated, do not insert
            }, { onConflict: 'student_id,subject,month' });
          }

          // ── 8. Calculate risk ────────────────────────────────
          const avgGrade = subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length;
          const risk     = calculateRisk(attendancePct, avgGrade, assignmentPct);

          await supabase.from('risk_scores').upsert({
            student_id:       studentId,
            score:            Number(risk.score.toFixed(2)),
            risk_level:       risk.level,
            attendance_score: Number(attendancePct.toFixed(2)),
            grade_score:      Number(avgGrade.toFixed(2)),
            assignment_score: Number(assignmentPct.toFixed(2)),
          }, { onConflict: 'student_id' });

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
          console.error('Row Error:', rowErr);
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
