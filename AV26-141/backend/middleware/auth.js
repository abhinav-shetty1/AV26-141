const { supabase } = require('../supabase');

/**
 * Verifies the Supabase JWT sent from the frontend.
 * Attaches req.user = { id, email, role, full_name }
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = header.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('🔓 Auth Error:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch role from public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    req.user = {
      id:        user.id,
      email:     user.email,
      role:      userData?.role,
      full_name: userData?.full_name,
    };
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Usage: router.get('/path', requireAuth, requireRole('teacher'), handler)
 */
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `Access denied — ${role} only` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
