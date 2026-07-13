import { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const CURRENT_YEAR = new Date().getFullYear()

const GRADE_YEAR_OPTIONS = [
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College Freshman (Year 1)',
  'College Sophomore (Year 2)',
  'College Junior (Year 3)',
  'College Senior (Year 4)',
  'Graduate Student',
  'Other',
]

const SKILL_OPTIONS = [
  'Programming',
  'Design',
  'Data Analysis',
  'Marketing',
  'Product Management',
  'Writing / Communication',
  'Leadership',
  'Research',
  'Other',
]

function wordCount(s) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

function isValidUrl(s) {
  return /^https?:\/\/.+/.test(s.trim())
}

function SectionHeader({ title }) {
  return (
    <div className="pb-2 border-b border-white/10">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-xs text-red-400 mt-1">{msg}</p>
}

function Field({ label, required = false, optional = false, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-zinc-500"> *</span>}
        {optional && <span className="text-gray-600 font-normal"> (optional)</span>}
      </label>
      {children}
      {error
        ? <FieldError msg={error} />
        : hint
          ? <p className="text-xs text-zinc-600 mt-1">{hint}</p>
          : null
      }
    </div>
  )
}

export default function ApplyModal({ internship, onClose, onSuccess }) {
  const { user, profile } = useAuth()

  const nameParts = (profile?.full_name || '').trim().split(' ')
  const [form, setForm] = useState({
    first_name:                nameParts[0] || '',
    last_name:                 nameParts.slice(1).join(' ') || '',
    email:                     user?.email || '',
    phone:                     '',
    date_of_birth:             '',
    grade_year:                '',
    school_name:               '',
    graduation_year:           '',
    city:                      '',
    state_region:              '',
    country:                   '',
    gpa:                       '',
    class_rank:                '',
    transcript_url:            '',
    activities_url:            '',
    skills:                    [],
    skills_details:            '',
    linkedin_url:              profile?.linkedin_url || '',
    portfolio_url:             '',
    underrepresented_response: '',
    program_motivation:        '',
    favorite_tech:             '',
    tech_problem:              '',
    career_goal:               '',
    inspiration:               '',
    why_interested:            '',
  })

  const [errors, setErrors]           = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function toggleSkill(skill) {
    setForm(f => {
      const next = f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill]
      return { ...f, skills: next }
    })
    if (errors.skills) setErrors(prev => { const n = { ...prev }; delete n.skills; return n })
  }

  function inputClass(key) {
    return `input${errors[key] ? ' border-red-600 focus:ring-red-500' : ''}`
  }

  const needsSkillDetails = form.skills.includes('Programming') || form.skills.includes('Other')

  function validate() {
    const e = {}

    // Personal
    if (!form.first_name.trim())   e.first_name = 'Required'
    if (!form.last_name.trim())    e.last_name  = 'Required'
    if (!form.email.trim())        e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    if (!form.phone.trim())        e.phone = 'Required'
    if (!form.date_of_birth)       e.date_of_birth = 'Required'
    if (!form.grade_year)          e.grade_year = 'Required'
    if (!form.school_name.trim())  e.school_name = 'Required'
    if (!form.graduation_year) {
      e.graduation_year = 'Required'
    } else {
      const yr = parseInt(form.graduation_year)
      if (isNaN(yr) || yr < CURRENT_YEAR || yr > CURRENT_YEAR + 10)
        e.graduation_year = `Enter a year between ${CURRENT_YEAR} and ${CURRENT_YEAR + 10}`
    }
    if (!form.city.trim())         e.city = 'Required'
    if (!form.state_region.trim()) e.state_region = 'Required'
    if (!form.country.trim())      e.country = 'Required'

    // Academic
    if (!form.gpa) {
      e.gpa = 'Required'
    } else {
      const g = parseFloat(form.gpa)
      if (isNaN(g) || g < 0 || g > 4.0) e.gpa = 'Enter a value between 0.00 and 4.00'
    }
    if (!form.transcript_url.trim()) {
      e.transcript_url = 'Required'
    } else if (!isValidUrl(form.transcript_url)) {
      e.transcript_url = 'Must be a valid URL starting with https://'
    }

    // Activities & Skills
    if (!form.activities_url.trim()) {
      e.activities_url = 'Required'
    } else if (!isValidUrl(form.activities_url)) {
      e.activities_url = 'Must be a valid URL starting with https://'
    }
    if (form.skills.length === 0) e.skills = 'Select at least one skill'
    if (needsSkillDetails && !form.skills_details.trim()) e.skills_details = 'Please provide details for Programming or Other'

    // Links (optional but validated if filled)
    if (form.linkedin_url.trim() && !isValidUrl(form.linkedin_url))   e.linkedin_url  = 'Must start with https://'
    if (form.portfolio_url.trim() && !isValidUrl(form.portfolio_url)) e.portfolio_url = 'Must start with https://'

    // Text responses
    if (!form.underrepresented_response.trim()) e.underrepresented_response = 'Required'
    if (!form.program_motivation.trim())        e.program_motivation = 'Required'

    // Quick takes
    if (!form.favorite_tech.trim()) e.favorite_tech = 'Required'
    if (!form.tech_problem.trim())  e.tech_problem  = 'Required'
    if (!form.career_goal.trim())   e.career_goal   = 'Required'
    if (!form.inspiration.trim())   e.inspiration   = 'Required'

    // Statement
    if (!form.why_interested.trim()) {
      e.why_interested = 'Required'
    } else if (form.why_interested.trim().length < 50) {
      e.why_interested = 'Please write at least 50 characters'
    }

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitError('')
    setLoading(true)

    const { error } = await supabase.from('applications').insert({
      internship_id:             internship.id,
      user_id:                   user.id,
      first_name:                form.first_name.trim(),
      last_name:                 form.last_name.trim(),
      email:                     form.email.trim(),
      phone:                     form.phone.trim(),
      date_of_birth:             form.date_of_birth,
      grade_year:                form.grade_year,
      school_name:               form.school_name.trim(),
      graduation_year:           parseInt(form.graduation_year),
      city:                      form.city.trim(),
      state_region:              form.state_region.trim(),
      country:                   form.country.trim(),
      gpa:                       parseFloat(form.gpa),
      class_rank:                form.class_rank.trim() || null,
      transcript_url:            form.transcript_url.trim(),
      activities_url:            form.activities_url.trim(),
      skills:                    form.skills,
      skills_details:            form.skills_details.trim() || null,
      linkedin_url:              form.linkedin_url.trim() || null,
      portfolio_url:             form.portfolio_url.trim() || null,
      underrepresented_response: form.underrepresented_response.trim(),
      program_motivation:        form.program_motivation.trim(),
      favorite_tech:             form.favorite_tech.trim(),
      tech_problem:              form.tech_problem.trim(),
      career_goal:               form.career_goal.trim(),
      inspiration:               form.inspiration.trim(),
      why_interested:            form.why_interested.trim(),
    })

    setLoading(false)

    if (error) {
      setSubmitError(
        error.code === '23505'
          ? 'You have already applied to this role.'
          : error.message
      )
      return
    }

    setSubmitted(true)
    onSuccess?.(internship.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl my-4 animate-slide-up">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: internship.bgColor }}
            >
              {internship.company[0]}
            </div>
            <div>
              <p className="text-xs text-zinc-500">{internship.company}</p>
              <h2 className="font-bold text-white text-sm leading-snug">{internship.role}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-600/20 border border-accent-600/30 flex items-center justify-center">
              <CheckCircle size={28} className="text-accent-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-white mb-2">Application submitted!</p>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                We will review your application and reach out if you are shortlisted for an intro to {internship.company}.
              </p>
            </div>
            <button onClick={onClose} className="btn-primary mt-2">Done</button>
          </div>
        ) : (

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-7">

            {submitError && (
              <div className="flex items-center gap-2.5 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {submitError}
              </div>
            )}

            {/* ── Personal Information ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Personal Information" />

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First name" required error={errors.first_name}>
                  <input type="text" className={inputClass('first_name')} placeholder="Jane"
                    value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                </Field>
                <Field label="Last name" required error={errors.last_name}>
                  <input type="text" className={inputClass('last_name')} placeholder="Smith"
                    value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email address" required error={errors.email}>
                  <input type="email" className={inputClass('email')} placeholder="you@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Phone number" required error={errors.phone}>
                  <input type="tel" className={inputClass('phone')} placeholder="+1 (555) 000-0000"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Date of birth" required error={errors.date_of_birth}>
                  <input type="date" className={inputClass('date_of_birth')}
                    value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </Field>
                <Field label="Grade / school year" required error={errors.grade_year}>
                  <select className={inputClass('grade_year')} value={form.grade_year} onChange={e => set('grade_year', e.target.value)}>
                    <option value="">Select year...</option>
                    {GRADE_YEAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="School name" required error={errors.school_name}>
                <input type="text" className={inputClass('school_name')} placeholder="University of California, Berkeley"
                  value={form.school_name} onChange={e => set('school_name', e.target.value)} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Expected graduation year" required error={errors.graduation_year}>
                  <input type="number" className={inputClass('graduation_year')}
                    placeholder={String(CURRENT_YEAR + 1)} min={CURRENT_YEAR} max={CURRENT_YEAR + 10}
                    value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="City" required error={errors.city}>
                  <input type="text" className={inputClass('city')} placeholder="San Francisco"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
                <Field label="State / region" required error={errors.state_region}>
                  <input type="text" className={inputClass('state_region')} placeholder="California"
                    value={form.state_region} onChange={e => set('state_region', e.target.value)} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Country" required error={errors.country}>
                  <input type="text" className={inputClass('country')} placeholder="United States"
                    value={form.country} onChange={e => set('country', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* ── Academic Information ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Academic Information" />

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Cumulative GPA" required hint="On a 4.0 scale" error={errors.gpa}>
                  <input type="number" className={inputClass('gpa')} placeholder="3.75"
                    min="0" max="4.0" step="0.01"
                    value={form.gpa} onChange={e => set('gpa', e.target.value)} />
                </Field>
                <Field label="Class rank" optional error={errors.class_rank}>
                  <input type="text" className={inputClass('class_rank')} placeholder="e.g. 15 / 300 or Top 10%"
                    value={form.class_rank} onChange={e => set('class_rank', e.target.value)} />
                </Field>
              </div>

              <Field label="Transcript / resume link" required
                hint="Link to a PDF — Google Drive, Dropbox, or similar. File upload support coming soon."
                error={errors.transcript_url}>
                <input type="url" className={inputClass('transcript_url')} placeholder="https://drive.google.com/..."
                  value={form.transcript_url} onChange={e => set('transcript_url', e.target.value)} />
              </Field>
            </div>

            {/* ── Activities and Skills ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Activities and Skills" />

              <Field label="Resume or activities list" required
                hint="Link to a PDF or document listing your extracurriculars — Google Drive, Dropbox, or similar."
                error={errors.activities_url}>
                <input type="url" className={inputClass('activities_url')} placeholder="https://drive.google.com/..."
                  value={form.activities_url} onChange={e => set('activities_url', e.target.value)} />
              </Field>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Skills <span className="text-zinc-500">*</span>
                  <span className="text-gray-600 font-normal text-xs ml-1">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        form.skills.includes(skill)
                          ? 'bg-brand-600/20 text-brand-300 border-brand-600/40'
                          : 'bg-zinc-800 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.skills} />
              </div>

              {needsSkillDetails && (
                <Field
                  label={'If you selected "Programming" or "Other", please provide details'}
                  required
                  error={errors.skills_details}
                >
                  <textarea
                    className={`input resize-none ${errors.skills_details ? 'border-red-600 focus:ring-red-500' : ''}`}
                    rows={3}
                    placeholder="e.g. Python, JavaScript, React — or describe your other skill..."
                    value={form.skills_details}
                    onChange={e => set('skills_details', e.target.value)}
                  />
                </Field>
              )}
            </div>

            {/* ── Links ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Links" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="LinkedIn" optional error={errors.linkedin_url}>
                  <input type="url" className={inputClass('linkedin_url')} placeholder="https://linkedin.com/in/..."
                    value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
                </Field>
                <Field label="Portfolio / GitHub" optional error={errors.portfolio_url}>
                  <input type="url" className={inputClass('portfolio_url')} placeholder="https://github.com/..."
                    value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* ── Text Response Questions ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Text Response Questions" />
              <p className="text-xs text-zinc-500 leading-relaxed -mt-1">
                Don't worry about grammar or writing style here. The ideas matter much more than how they're written — your "rough draft" is perfectly acceptable.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-0.5">
                  How do you consider yourself underrepresented in the tech industry?<span className="text-zinc-500"> *</span>
                  <span className="text-gray-600 font-normal text-xs ml-1">(~100-word limit)</span>
                </label>
                <p className="text-xs text-zinc-600 mb-1.5 leading-relaxed">
                  Discuss any aspects of your background, experiences, or perspectives that make you unique in the tech landscape. This doesn't just have to be about race; gender identity, religion, or geographic location count too.
                </p>
                <textarea
                  className={`input resize-none ${errors.underrepresented_response ? 'border-red-600 focus:ring-red-500' : ''}`}
                  rows={4}
                  placeholder="Share your perspective..."
                  value={form.underrepresented_response}
                  onChange={e => set('underrepresented_response', e.target.value)}
                />
                <div className="flex items-start justify-between mt-1 gap-2">
                  <FieldError msg={errors.underrepresented_response} />
                  <p className={`text-xs ml-auto shrink-0 ${wordCount(form.underrepresented_response) > 100 ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {wordCount(form.underrepresented_response)} / ~100 words
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-0.5">
                  Why do you want to participate in this program?<span className="text-zinc-500"> *</span>
                  <span className="text-gray-600 font-normal text-xs ml-1">(~100-word limit)</span>
                </label>
                <p className="text-xs text-zinc-600 mb-1.5">
                  Explain your motivations for applying and what you hope to gain from this experience.
                </p>
                <textarea
                  className={`input resize-none ${errors.program_motivation ? 'border-red-600 focus:ring-red-500' : ''}`}
                  rows={4}
                  placeholder="What draws you to this opportunity..."
                  value={form.program_motivation}
                  onChange={e => set('program_motivation', e.target.value)}
                />
                <div className="flex items-start justify-between mt-1 gap-2">
                  <FieldError msg={errors.program_motivation} />
                  <p className={`text-xs ml-auto shrink-0 ${wordCount(form.program_motivation) > 100 ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {wordCount(form.program_motivation)} / ~100 words
                  </p>
                </div>
              </div>
            </div>

            {/* ── Quick Takes ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Quick Takes" />
              <p className="text-xs text-zinc-500 -mt-1">
                Keep these short and sweet, and focus on the answers. No AI please! 🙂
              </p>

              <Field label="What's your favorite tech product or app? Why?" required error={errors.favorite_tech}>
                <input type="text" className={inputClass('favorite_tech')}
                  placeholder="e.g. Notion, because..."
                  value={form.favorite_tech} onChange={e => set('favorite_tech', e.target.value)} />
              </Field>

              <Field label="If you could solve one problem using technology, what would it be?" required error={errors.tech_problem}>
                <input type="text" className={inputClass('tech_problem')}
                  placeholder="The problem I would tackle is..."
                  value={form.tech_problem} onChange={e => set('tech_problem', e.target.value)} />
              </Field>

              <Field label="What do you hope to achieve in your future career?" required error={errors.career_goal}>
                <input type="text" className={inputClass('career_goal')}
                  placeholder="I want to..."
                  value={form.career_goal} onChange={e => set('career_goal', e.target.value)} />
              </Field>

              <Field label="What inspires you?" required error={errors.inspiration}>
                <input type="text" className={inputClass('inspiration')}
                  placeholder="I'm inspired by..."
                  value={form.inspiration} onChange={e => set('inspiration', e.target.value)} />
              </Field>
            </div>

            {/* ── Statement ── */}
            <div className="flex flex-col gap-4">
              <SectionHeader title="Statement" />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Why are you interested in this role?<span className="text-zinc-500"> *</span>
                </label>
                <textarea
                  className={`input resize-none ${errors.why_interested ? 'border-red-600 focus:ring-red-500' : ''}`}
                  rows={4}
                  placeholder={`Tell us why you want to intern at ${internship.company} and what you would bring to this role...`}
                  value={form.why_interested}
                  onChange={e => set('why_interested', e.target.value)}
                />
                <div className="flex items-start justify-between mt-1 gap-2">
                  <FieldError msg={errors.why_interested} />
                  <p className={`text-xs ml-auto shrink-0 ${form.why_interested.length < 50 ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {form.why_interested.length} / 50 min chars
                  </p>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={15} />
                    Submit application
                  </span>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}
