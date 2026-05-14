const { supabase } = require('../supabase');

async function getAllAlerts(req, res) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id, message, risk_level, reviewed, note, follow_up_date, created_at,
        students ( id, roll_no, users!user_id(full_name, email) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUnreviewed(req, res) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id, message, risk_level, reviewed, note, follow_up_date, created_at,
        students ( id, roll_no, users!user_id(full_name, email) )
      `)
      .eq('reviewed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createAlert(req, res) {
  try {
    const { student_id, message, risk_level } = req.body;
    const { data, error } = await supabase
      .from('alerts')
      .insert({ student_id, teacher_id: req.user.id, message, risk_level })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reviewAlert(req, res) {
  try {
    const { id } = req.params;
    const { note, follow_up_date } = req.body;

    const { data, error } = await supabase
      .from('alerts')
      .update({ reviewed: true, note, follow_up_date })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllAlerts, getUnreviewed, createAlert, reviewAlert };
