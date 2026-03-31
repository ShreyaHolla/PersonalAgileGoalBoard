import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users stay logged in across tabs
    persistSession: true,
    // Automatically refresh JWT tokens before they expire
    autoRefreshToken: true,
    // Detect session from URL (needed for password reset flow)
    detectSessionInUrl: true,
    // Use PKCE flow — more secure than implicit flow for SPAs
    flowType: 'pkce',
  },
})
