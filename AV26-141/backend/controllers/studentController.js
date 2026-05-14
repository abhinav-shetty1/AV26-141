const { supabase }                 = require('../supabase');
const { calculateProgress }        = require('../services/progressEngine');
const { buildStudentNotifications } = require('../services/riskEngine');

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    // 1. Get student profile
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('id, roll_no, class, section')
      .eq('user_id', userId)
      .single();

    if (sErr || !student) {
      return res.status(404).json({ error: 'Student profile not found. Contact your teacher.' });
    }

    const sid = student.id;

    // 2. Fetch everything in parallel
    const [gradesRes, attendanceRes, assignmentsRes, riskRes, alertsRes] = await Promise.all([
      supabase.from('grades').select('*').eq('student_id', sid).order('exam_date', { ascending: false }),
      supabase.from('attendance').select('*').eq('student_id', sid).order('month', { ascending: false }),
      supabase.from('assignments').select('*').eq('student_id', sid),
      supabase.from('risk_scores').select('*').eq('student_id', sid)
        .order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('alerts').select('message').eq('student_id', sid).eq('reviewed', false),
    ]);

    const grades      = gradesRes.data      ?? [];
    const attendance  = attendanceRes.data  ?? [];
    const assignments = assignmentsRes.data ?? [];
    const risk        = riskRes.data;

    // 3. Compute derived values
    const avgMarks = grades.length
      ? grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length
      : 0;

    const latestAttendancePct = attendance.length ? Number(attendance[0].percentage) : 0;

    const avgAssignmentPct = assignments.length
      ? assignments.reduce((sum, a) => sum + Number(a.completion_rate), 0) / assignments.length
      : 0;

    const progress   = calculateProgress(avgMarks, latestAttendancePct, avgAssignmentPct);
    const dbAlerts   = (alertsRes.data || []).map(a => a.message);
    const autoAlerts = buildStudentNotifications(grades, latestAttendancePct, avgMarks);
    const notifications = [...dbAlerts, ...autoAlerts];

    res.json({
      student: { ...student, full_name: req.user.full_name, email: req.user.email },
      grades,
      attendance,
      assignments,
      risk,
      summary: {
        avgMarks:       Math.round(avgMarks * 10) / 10,
        attendancePct:  latestAttendancePct,
        assignmentPct:  Math.round(avgAssignmentPct * 10) / 10,
        progress,
        notifications,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGrades(req, res) {
  try {
    const { data: student } = await supabase
      .from('students').select('id').eq('user_id', req.user.id).single();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data } = await supabase
      .from('grades').select('*').eq('student_id', student.id)
      .order('exam_date', { ascending: false });

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAttendance(req, res) {
  try {
    const { data: student } = await supabase
      .from('students').select('id').eq('user_id', req.user.id).single();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data } = await supabase
      .from('attendance').select('*').eq('student_id', student.id)
      .order('month', { ascending: true });

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProgress(req, res) {
  try {
    const { data: student } = await supabase
      .from('students').select('id').eq('user_id', req.user.id).single();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const sid = student.id;
    const [gradesRes, attRes, assignRes] = await Promise.all([
      supabase.from('grades').select('score').eq('student_id', sid),
      supabase.from('attendance').select('percentage').eq('student_id', sid)
        .order('month', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('assignments').select('completion_rate').eq('student_id', sid),
    ]);

    const grades = gradesRes.data ?? [];
    const avgMarks = grades.length
      ? grades.reduce((s, g) => s + Number(g.score), 0) / grades.length : 0;
    const attendancePct = attRes.data ? Number(attRes.data.percentage) : 0;
    const assigns = assignRes.data ?? [];
    const assignPct = assigns.length
      ? assigns.reduce((s, a) => s + Number(a.completion_rate), 0) / assigns.length : 0;

    res.json({ progress: calculateProgress(avgMarks, attendancePct, assignPct) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDashboard, getGrades, getAttendance, getProgress };
