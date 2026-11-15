import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Security Verification: Ensure privileged backend secrets are NEVER present in frontend environment
if (typeof window !== 'undefined') {
  const envKeys = Object.keys(import.meta.env);
  const leakedSecret = envKeys.find(key => {
    const lower = key.toLowerCase();
    return lower.includes(['service', 'role'].join('_')) || lower.includes(['service', 'key'].join('_'));
  });
  if (leakedSecret) {
    console.error('CRITICAL SECURITY VIOLATION: Privileged key detected in frontend environment!');
    throw new Error('Security Violation: Backend keys must never be exposed to the browser.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
