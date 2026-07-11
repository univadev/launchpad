import { createContext, useContext, useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { signOut: clerkSignOut } = useClerk()

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const user = isSignedIn && clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      }
    : null

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    fetchProfile(user.id, user.email)
  }, [isLoaded, user?.id])

  async function fetchProfile(userId, email) {
    try {
      // Normal path: profile keyed by the current (Clerk) id.
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) console.error('fetchProfile error:', error.message)

      // Account-linking path: no profile for this Clerk id yet, but an older
      // account exists with the same email (from the pre-Clerk Supabase-Auth
      // days). Adopt it by re-keying its id to the Clerk id — the foreign keys
      // use ON UPDATE CASCADE, so their projects/reactions/etc. come along.
      if (!data && email) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email)
          .neq('id', userId)
          .limit(1)
          .maybeSingle()

        if (existing?.id) {
          const { data: relinked, error: relinkErr } = await supabase
            .from('users')
            .update({ id: userId })
            .eq('id', existing.id)
            .select('*')
            .maybeSingle()
          if (relinkErr) console.error('account link error:', relinkErr.message)
          data = relinked ?? data
        }
      }

      setProfile(data ?? null)
    } catch (err) {
      console.error('fetchProfile exception:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id, user.email)
  }

  async function signOut() {
    await clerkSignOut()
    setProfile(null)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading: !isLoaded,
      profileLoading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
