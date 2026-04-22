import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ SUPABASE CREDENTIALS MISSING ⚠️');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.');
}

// Create a dummy client if credentials are missing so the app doesn't crash immediately,
// but it will fail when trying to make actual requests.
export const supabase = createClient(
  supabaseUrl || 'https://missing-project-id.supabase.co',
  supabaseAnonKey || 'missing-anon-key'
);
