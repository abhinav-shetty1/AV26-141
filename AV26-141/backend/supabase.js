const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ override: true });

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.EDUPULSE_SECRET?.trim();

console.log('🔗 URL:', url);
console.log('🔑 Key Length:', key ? key.length : 0);
if (key) {
  console.log('🔑 Key Start:', key.substring(0, 10));
}

const supabase = createClient(url, key);

module.exports = { supabase };
