import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Authenticate every Supabase request with the Clerk session token.
//
// With the Clerk <> Supabase integration enabled, the token carries the claims
// Supabase needs: `role: authenticated` and `sub: <clerk user id>`. RLS policies
// read the caller's identity via auth.jwt()->>'sub' (see db/migrations/004).
//
// `window.Clerk` is populated by <ClerkProvider> (App.jsx). When no user is
// signed in, getToken() resolves to null and the request runs as the anon role.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    if (typeof window === 'undefined') return null
    try {
      return (await window.Clerk?.session?.getToken()) ?? null
    } catch {
      return null
    }
  },
})

export default supabase
