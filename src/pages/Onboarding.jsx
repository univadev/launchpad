import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FIELDS_OF_INTEREST, COUNTRIES, normalizeUrl } from '../lib/utils'
import AdmissionsProfile, { clearAdmissionsDraft } from '../components/AdmissionsProfile'
import { ArrowRight, ArrowLeft, Check, Sparkles, Lightbulb, Linkedin, Github, MessageCircle } from 'lucide-react'

const GRADUATION_YEARS = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i)

const INTEREST_OPTIONS = [
  'Algorithms', 'Machine Learning', 'Web Dev', 'Mobile Dev', 'Robotics',
  'Biotech', 'Space', 'Climate Tech', 'EdTech', 'FinTech', 'Hardware',
  'Game Dev', 'Open Source', 'Research', 'Startups', 'Design', 'Math',
  'Quantum Computing', 'Cybersecurity', 'Data Science'
]

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [admissionsValid, setAdmissionsValid] = useState(true)
  const [admissionsData, setAdmissionsData] = useState(null)

  const username = localStorage.getItem('pending_username') || user?.email?.split('@')[0] || 'builder'

  const [form, setForm] = useState({
    full_name: '',
    school: '',
    graduation_year: new Date().getFullYear() + 1,
    field_of_interest: '',
    interests: [],
    goal: '',
    country: '',
    linkedin_url: '',
    github_url: '',
    discord_username: '',
  })

  const steps = [
    { title: 'What should we call you?', subtitle: 'Your name and where you\'re studying' },
    { title: 'What drives you?', subtitle: 'Your field and what you\'re into' },
    { title: 'What are you working toward?', subtitle: 'Your goal — be honest, be bold' },
    { title: 'Connect your socials', subtitle: 'Visible only to people you\'ve connected with' },
    { title: 'Admissions profile', subtitle: 'Grade 12 courses, universities & program rankings' },
  ]

  function toggleInterest(interest) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : f.interests.length < 8 ? [...f.interests, interest] : f.interests
    }))
  }

  function canProceed() {
    if (step === 0) return form.full_name.trim().length >= 2 && form.graduation_year
    if (step === 1) return form.field_of_interest && form.interests.length >= 1
    if (step === 2) return form.goal.trim().length >= 10
    if (step === 3) return true
    if (step === 4) return admissionsValid
    return false
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const cleanUsername = username.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'builder'

      const profileData = {
        id: user.id,
        email: user.email,
        username: cleanUsername,
        full_name: form.full_name.trim(),
        school: form.school.trim() || null,
        graduation_year: form.graduation_year,
        field_of_interest: form.field_of_interest,
        interests: form.interests,
        goal: form.goal.trim(),
        country: form.country || null,
        linkedin_url: normalizeUrl(form.linkedin_url),
        github_url: normalizeUrl(form.github_url),
        discord_username: form.discord_username.trim() || null,
        admissions_profile: admissionsData || {},
        current_streak: 0,
        last_post_date: null,
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' })

      if (upsertError) {
        throw new Error(upsertError.message || JSON.stringify(upsertError))
      }

      localStorage.removeItem('pending_username')
      clearAdmissionsDraft(user.id)
      await refreshProfile()
      navigate('/feed', { replace: true })
    } catch (err) {
      console.error('Onboarding submit error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function handleNext() {
    if (step < steps.length - 1) setStep(s => s + 1)
    else handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className={`w-full ${step === 4 ? 'max-w-3xl' : 'max-w-lg'}`}>
        {/* Logo & header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-4">U</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={16} className="text-brand-400" />
            <span className="text-sm font-medium text-brand-400">Almost there, @{username}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{steps[step].title}</h1>
          <p className="text-gray-400 text-sm mt-1">{steps[step].subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        {/* Step content */}
        <div className={step === 4 ? 'animate-fade-in' : 'card p-6 animate-fade-in'}>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Maya Chen"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  School <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Thomas Jefferson High School"
                  value={form.school}
                  onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Graduation year *</label>
                  <select
                    className="input"
                    value={form.graduation_year}
                    onChange={e => setForm(f => ({ ...f, graduation_year: parseInt(e.target.value) }))}
                  >
                    {GRADUATION_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Country <span className="text-gray-600">(optional)</span>
                  </label>
                  <select
                    className="input"
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Primary field *</label>
                <select
                  className="input"
                  value={form.field_of_interest}
                  onChange={e => setForm(f => ({ ...f, field_of_interest: e.target.value }))}
                  autoFocus
                >
                  <option value="">What are you most into?</option>
                  {FIELDS_OF_INTEREST.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interests <span className="text-gray-500 text-xs">(pick up to 8)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.interests.includes(interest)
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">{form.interests.length}/8 selected</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  What are you working toward? *
                </label>
                <p className="text-xs text-gray-500 mb-2">Your goal — could be a project, a dream, a school, a mission. Be real.</p>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="e.g. Building an AI tool that helps first-gen students access mentorship, then studying CS at MIT to keep going."
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value.slice(0, 280) }))}
                  autoFocus
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${form.goal.length > 250 ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {form.goal.length}/280
                  </span>
                </div>
              </div>

              <div className="p-3 bg-brand-900/30 border border-brand-800/30 rounded-lg text-brand-300 text-xs leading-relaxed flex items-start gap-2">
                <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
                Your goal is displayed prominently on your profile. It's your "why." Employers, mentors, and fellow builders will read this.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-500 -mt-1">
                All optional. These stay hidden from strangers — only people you've accepted a connection with will see them.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Linkedin size={14} /> LinkedIn
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://linkedin.com/in/your-handle"
                  value={form.linkedin_url}
                  onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Github size={14} /> GitHub
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://github.com/your-handle"
                  value={form.github_url}
                  onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} /> Discord
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="your_discord_username"
                  value={form.discord_username}
                  onChange={e => setForm(f => ({ ...f, discord_username: e.target.value }))}
                />
              </div>
              <p className="text-xs text-gray-600">You can edit or add these anytime from Settings.</p>
            </div>
          )}

          {step === 4 && (
            <AdmissionsProfile
              userId={user?.id}
              embedded
              onValidityChange={setAdmissionsValid}
              onDataChange={setAdmissionsData}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="btn-primary disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                Setting up...
              </span>
            ) : step === steps.length - 1 ? (
              <span className="flex items-center gap-2">Launch my profile <Check size={16} /></span>
            ) : (
              <span className="flex items-center gap-2">Next <ArrowRight size={16} /></span>
            )}
          </button>
        </div>

        {step === 4 && !admissionsValid && (
          <p className="text-right text-xs text-amber-300 mt-2">
            Resolve the missing course requirements in Step 5 before you can launch your profile.
          </p>
        )}
      </div>
    </div>
  )
}
