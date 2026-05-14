const { supabase } = require('../supabase');

async function getDashboard(req, res) {
  try {
    const [studentsRes, riskRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('risk_scores').select('risk_level, attendance_score'),
    ]);

    const risks = riskRes.data || [];
    const atRiskCount = risks.filter(r => r.risk_level === 'at_risk').length;
    const criticalCount = risks.filter(r => r.risk_level === 'critical').length;
    
    const totalAttendance = risks.reduce((sum, r) => sum + (Number(r.attendance_score) || 0), 0);
    const avgAttendance = risks.length > 0 ? totalAttendance / risks.length : 0;

    res.json({
      totalStudents: studentsRes.count || 0,
      atRiskCount,
      criticalCount,
      avgAttendance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllStudents(req, res) {
  try {
    // Join students → users → latest risk_score
    const { data, error } = await supabase
      .from('students')
      .select(`
        id, roll_no, class, section,
        users!user_id ( full_name, email ),
        risk_scores ( score, risk_level, calculated_at, attendance_score, grade_score )
      `)
      .order('roll_no');

    if (error) throw error;

    // Flatten: keep only the latest risk_score per student
    const result = (data ?? []).map(s => ({
      id:         s.id,
      roll_no:    s.roll_no,
      class:      s.class,
      section:    s.section,
      full_name:  s.users?.full_name ?? '—',
      email:      s.users?.email    ?? '—',
      risk:       Array.isArray(s.risk_scores) 
        ? s.risk_scores.sort((a, b) => new Date(b.calculated_at) - new Date(a.calculated_at))[0] 
        : (s.risk_scores || null),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAtRiskStudents(req, res) {
  try {
    const { data, error } = await supabase
      .from('risk_scores')
      .select(`
        score, risk_level, calculated_at,
        attendance_score, grade_score, assignment_score,
        students (
          id, roll_no, class, section,
          users!user_id ( full_name, email )
        )
      `)
      .in('risk_level', ['at_risk', 'critical'])
      .order('score', { ascending: true }); // worst first

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getStudentDetail(req, res) {
  try {
    const { studentId } = req.params;

    const [profileRes, gradesRes, attendanceRes, assignmentsRes, riskRes, alertsRes] =
      await Promise.all([
        supabase.from('students')
          .select('id, roll_no, class, section, users!user_id(full_name, email)')
          .eq('id', studentId).single(),
        supabase.from('grades').select('*').eq('student_id', studentId)
          .order('exam_date', { ascending: false }),
        supabase.from('attendance').select('*').eq('student_id', studentId)
          .order('month', { ascending: true }),
        supabase.from('assignments').select('*').eq('student_id', studentId),
        supabase.from('risk_scores').select('*').eq('student_id', studentId)
          .order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('alerts').select('*').eq('student_id', studentId)
          .order('created_at', { ascending: false }),
      ]);

    res.json({
      profile:     profileRes.data,
      grades:      gradesRes.data      ?? [],
      attendance:  attendanceRes.data  ?? [],
      assignments: assignmentsRes.data ?? [],
      risk:        riskRes.data,
      alerts:      alertsRes.data      ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDashboard, getAllStudents, getAtRiskStudents, getStudentDetail };
