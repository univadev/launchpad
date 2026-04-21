import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ]
  const strength = checks.filter(c => c.ok).length
  const colors = ['bg-gray-700', 'bg-red-500', 'bg-yellow-500', 'bg-green-500']

  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-gray-700'}`} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {checks.map(({ label, ok }) => (
          <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-gray-600'}`}>
            <CheckCircle2 size={11} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function checkUsername(username) {
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, and underscores'
    const { data } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
    if (data) return 'Username already taken'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate username
    const usernameError = await checkUsername(form.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await signUp(form.email, form.password)

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Store username in metadata or as session data — we'll create the profile in onboarding
    // For now, store username in localStorage so onboarding can use it
    localStorage.setItem('pending_username', form.username)
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-white logo">
             <img src="/favicon.svg" alt="Univa Dev" className="w-8 h-8" />
            Univa Dev
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm">Join thousands of high school builders</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3 mb-4 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  type="text"
                  className="input pl-7"
                  placeholder="yourhandle"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  maxLength={30}
                  required
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">Letters, numbers, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Continue <ArrowRight size={16} /></span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already building?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-600 mt-3">
          By signing up you agree to have a good time building things.
        </p>
      </div>
    </div>
  )
}
