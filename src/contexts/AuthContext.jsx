import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on mount,
    // which replaces the need for a separate getSession() call.
    // Using both causes a race condition that locks up on reload.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Use setTimeout 0 to avoid Supabase deadlock in some edge cases
          setProfileLoading(true)
          setTimeout(() => fetchProfile(currentUser.id), 0)
        } else {
          setProfile(null)
          setProfileLoading(false)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile error:', error.message)
      }
      setProfile(data ?? null)
    } catch (err) {
      console.error('fetchProfile exception:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
