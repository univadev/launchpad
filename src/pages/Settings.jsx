import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FIELDS_OF_INTEREST, COUNTRIES } from '../lib/utils'
import { Save, Upload, AlertCircle, CheckCircle2, Camera, Trash2, Linkedin, Github, MessageCircle } from 'lucide-react'

const INTEREST_OPTIONS = [
  'Algorithms', 'Machine Learning', 'Web Dev', 'Mobile Dev', 'Robotics',
  'Biotech', 'Space', 'Climate Tech', 'EdTech', 'FinTech', 'Hardware',
  'Game Dev', 'Open Source', 'Research', 'Startups', 'Design', 'Math',
  'Quantum Computing', 'Cybersecurity', 'Data Science'
]

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const photoRef = useRef()

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    school: profile?.school || '',
    graduation_year: profile?.graduation_year || '',
    field_of_interest: profile?.field_of_interest || '',
    interests: profile?.interests || [],
    goal: profile?.goal || '',
    country: profile?.country || '',
    linkedin_url: profile?.linkedin_url || '',
    discord_username: profile?.discord_username || '',
    github_url: profile?.github_url || '',
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(profile?.profile_photo_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function toggleInterest(interest) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : f.interests.length < 8 ? [...f.interests, interest] : f.interests
    }))
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Compress
    const canvas = document.createElement('canvas')
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = Math.min(img.width, img.height, 400)
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const offsetX = (img.width - size) / 2
      const offsetY = (img.height - size) / 2
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        setPhotoFile(blob)
        setPhotoPreview(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.85)
    }
    img.src = url
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Check username uniqueness if changed
      if (form.username !== profile?.username) {
        if (!/^[a-zA-Z0-9_]+$/.test(form.username)) throw new Error('Username can only contain letters, numbers, and underscores')
        const { data: existing } = await supabase.from('users').select('id').eq('username', form.username).neq('id', user.id).maybeSingle()
        if (existing) throw new Error('Username already taken')
      }

      // Upload photo if changed
      let photoUrl = profile?.profile_photo_url || null
      if (photoFile) {
        const fileName = `${user.id}/avatar.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoFile, { contentType: 'image/jpeg', upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
          photoUrl = publicUrl + `?t=${Date.now()}` // cache bust
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: form.full_name.trim(),
          username: form.username.trim(),
          bio: form.bio.trim() || null,
          school: form.school.trim() || null,
          graduation_year: form.graduation_year || null,
          field_of_interest: form.field_of_interest || null,
          interests: form.interests,
          goal: form.goal.trim() || null,
          country: form.country || null,
          linkedin_url: form.linkedin_url.trim() || null,
          discord_username: form.discord_username.trim() || null,
          github_url: form.github_url.trim() || null,
          profile_photo_url: photoUrl,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      await refreshProfile()
      setSuccess(true)
      setPhotoFile(null)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const GRADUATION_YEARS = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i)

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">Manage your profile</p>
        </div>

        {error && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-red-900/90 border border-red-800/70 rounded-lg text-red-100 text-sm shadow-lg backdrop-blur">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-green-900/90 border border-green-800/70 rounded-lg text-green-100 text-sm shadow-lg backdrop-blur">
            <CheckCircle2 size={16} className="shrink-0" />
            Profile updated!
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Photo */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">Profile photo</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-700" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-700 flex items-center justify-center text-white text-3xl font-bold">
                    {form.full_name[0] || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 hover:bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <Camera size={14} />
                </button>
              </div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <div>
                <button type="button" onClick={() => photoRef.current?.click()} className="btn-secondary text-sm">
                  <Upload size={14} />
                  Upload photo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    className="ml-2 btn-ghost text-sm text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-600 mt-1">Square image recommended. Max ~800px.</p>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">Basic info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name *</label>
                <input type="text" className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Username *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    className="input pl-7"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">School</label>
                <input type="text" className="input" value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Graduation year</label>
                <select className="input" value={form.graduation_year} onChange={e => setForm(f => ({ ...f, graduation_year: parseInt(e.target.value) }))}>
                  <option value="">Select...</option>
                  {GRADUATION_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Country</label>
                <select className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                  <option value="">Select...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Field of interest</label>
                <select className="input" value={form.field_of_interest} onChange={e => setForm(f => ({ ...f, field_of_interest: e.target.value }))}>
                  <option value="">Select...</option>
                  {FIELDS_OF_INTEREST.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
              <textarea className="input resize-none" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="A short bio (optional)" maxLength={160} />
            </div>
          </div>

          {/* Goal */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">Your goal</h2>
            <textarea
              className="input resize-none"
              rows={4}
              value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value.slice(0, 280) }))}
              placeholder="What are you working toward? Displayed prominently on your profile."
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-600">{form.goal.length}/280</span>
            </div>
          </div>

          {/* Interests */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-1">Interests</h2>
            <p className="text-xs text-gray-500 mb-3">Up to 8</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.interests.includes(interest)
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Social accounts */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-1">Social accounts</h2>
            <p className="text-xs text-gray-500 mb-3">Only people you've connected with can see these.</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Linkedin size={14} /> LinkedIn
                </label>
                <input
                  type="url"
                  className="input"
                  value={form.linkedin_url}
                  onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-handle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Github size={14} /> GitHub
                </label>
                <input
                  type="url"
                  className="input"
                  value={form.github_url}
                  onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                  placeholder="https://github.com/your-handle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} /> Discord
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.discord_username}
                  onChange={e => setForm(f => ({ ...f, discord_username: e.target.value }))}
                  placeholder="your_discord_username"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} />
                  Save changes
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
