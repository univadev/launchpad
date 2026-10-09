// Verify the caller's Clerk session token for a Netlify function.
//
// The functions call Groq on our key, so they must not be open to anonymous
// callers. Rather than pull in a JWT library, we hand the token to Supabase:
// with the Clerk <> Supabase integration on, PostgREST validates the
// signature and expiry and rejects bad tokens with a 401. A cheap,
// RLS-scoped probe query succeeding means the token is genuine.
//
// Returns the caller's Clerk user id, or null if unauthenticated.

import { createClient } from '@supabase/supabase-js'

function bearerToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function subject(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

export async function requireUser(event) {
  const token = bearerToken(event)
  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!token || !url || !anonKey) return null

  const sub = subject(token)
  if (!sub) return null

  const supabase = createClient(url, anonKey, {
    accessToken: async () => token,
    auth: { persistSession: false },
  })
  const { error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .limit(1)

  return error ? null : sub
}
