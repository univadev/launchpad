import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { VENUE_BY_ID, VENUE_KINDS } from '../lib/venues'
import {
  SUBMISSION_STATUSES, STATUS_META, WIN_STATUSES,
  daysUntil, deadlineLabel, isDueSoon,
  updateSubmission, deleteSubmission, notifySubmissionsChanged,
} from '../lib/submissions'
import { Target, ExternalLink, Trash2, AlertCircle, Clock, Sparkles } from 'lucide-react'

const SECTIONS = [
  { key: 'due', title: 'Due soon', match: s => isDueSoon(s) },
  { key: 'planning', title: 'Planning', match: s => s.status === 'planning' && !isDueSoon(s) },
  { key: 'submitted', title: 'Submitted — waiting to hear back', match: s => s.status === 'submitted' },
  { key: 'results', title: 'Results', match: s => WIN_STATUSES.includes(s.status) || s.status === 'rejected' },
]

// Soonest deadline first; rows without a deadline sink to the bottom.
function byDeadline(a, b) {
  if (!a.deadline) return b.deadline ? 1 : 0
  if (!b.deadline) return -1
  return a.deadline.localeCompare(b.deadline)
}

function SubmissionRow({ sub, onChange, onRemove }) {
  const venue = VENUE_BY_ID[sub.venue_id]
  const [note, setNote] = useState(sub.result_note || '')
  const days = daysUntil(sub.deadline)
  const urgent = sub.status === 'planning' && days !== null && days <= 2
  const showsResult = WIN_STATUSES.includes(sub.status) || sub.status === 'rejected'

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {venue ? (
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-brand-300 inline-flex items-center gap-1.5"
              >
                {venue.name} <ExternalLink size={12} className="text-zinc-500" />
              </a>
            ) : (
              <span className="font-semibold text-white">{sub.venue_id}</span>
            )}
            {venue && <span className="tag">{VENUE_KINDS[venue.kind] || venue.kind}</span>}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            for{' '}
            <Link to={`/post/${sub.project_id}`} className="text-brand-300 hover:underline">
              {sub.projects?.title || 'your project'}
            </Link>
            {venue?.timing && <span className="text-zinc-600"> · {venue.timing}</span>}
          </p>
        </div>
        <button
          onClick={() => onRemove(sub)}
          className="p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition-colors"
          title="Remove from tracker"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <select
          value={sub.status}
          onChange={e => onChange(sub, { status: e.target.value })}
          className={`badge border py-1 pr-6 bg-transparent cursor-pointer ${STATUS_META[sub.status].style}`}
          aria-label="Status"
        >
          {SUBMISSION_STATUSES.map(s => (
            <option key={s} value={s} className="bg-zinc-900 text-zinc-200">{STATUS_META[s].label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-zinc-500">
          Deadline
          <input
            type="date"
            value={sub.deadline || ''}
            onChange={e => onChange(sub, { deadline: e.target.value || null })}
            className="input py-1 px-2 text-xs w-auto [color-scheme:dark]"
          />
        </label>

        {sub.status === 'planning' && (
          <span className={`flex items-center gap-1 text-xs ${urgent ? 'text-red-300 font-medium' : 'text-zinc-500'}`}>
            <Clock size={12} /> {deadlineLabel(sub.deadline)}
          </span>
        )}
      </div>

      {showsResult && (
        <input
          type="text"
          value={note}
          maxLength={200}
          onChange={e => setNote(e.target.value)}
          onBlur={() => note !== (sub.result_note || '') && onChange(sub, { result_note: note.trim() || null })}
          placeholder={sub.status === 'rejected' ? 'What you learned (only you see this)' : 'Result, e.g. "2nd place, regional round"'}
          className="input text-sm mt-3"
        />
      )}
    </div>
  )
}

export default function Tracker() {
  const { user } = useAuth()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) fetchSubs()
  }, [user?.id])

  async function fetchSubs() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('venue_submissions')
      .select('*, projects(title)')
      .eq('user_id', user.id)
    if (err) setError('Could not load your tracker. Has migration 008 been run?')
    setSubs(data || [])
    setLoading(false)
  }

  async function handleChange(sub, changes) {
    setError('')
    // Optimistic: update locally, roll back if the write fails.
    setSubs(prev => prev.map(s => (s.id === sub.id ? { ...s, ...changes } : s)))
    const { error: err } = await updateSubmission(sub.id, changes)
    if (err) {
      setSubs(prev => prev.map(s => (s.id === sub.id ? sub : s)))
      setError('Could not save that change. Try again.')
      return
    }
    notifySubmissionsChanged()
  }

  async function handleRemove(sub) {
    const name = VENUE_BY_ID[sub.venue_id]?.name || 'this venue'
    if (!confirm(`Stop tracking ${name}?`)) return
    setError('')
    const { error: err } = await deleteSubmission(sub.id)
    if (err) {
      setError('Could not remove that. Try again.')
      return
    }
    setSubs(prev => prev.filter(s => s.id !== sub.id))
    notifySubmissionsChanged()
  }

  const sorted = [...subs].sort(byDeadline)

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Target size={20} />
          Submission tracker
        </h1>
        <p className="text-sm text-zinc-400 mt-1 mb-6">
          Where you're taking your projects. Accepted and award results show on your profile.
          Set a deadline and we'll email you a week before and the day before
          (<Link to="/settings" className="text-brand-300 hover:underline">settings</Link>).
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm mb-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
          </div>
        ) : subs.length === 0 ? (
          <div className="card p-10 text-center">
            <Sparkles size={22} className="mx-auto mb-3 text-brand-400" />
            <p className="text-zinc-300 font-medium">Nothing tracked yet</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Open one of your projects, run AI feedback, and hit <span className="text-zinc-300">Track</span> on
              a suggested competition, journal or hackathon.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {SECTIONS.map(({ key, title, match }) => {
              const rows = sorted.filter(match)
              if (!rows.length) return null
              return (
                <section key={key}>
                  <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${key === 'due' ? 'text-red-300' : 'text-zinc-500'}`}>
                    {title} <span className="text-zinc-600">({rows.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {rows.map(sub => (
                      <SubmissionRow key={sub.id} sub={sub} onChange={handleChange} onRemove={handleRemove} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
