import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, AlertCircle, RefreshCw, ExternalLink,
  CheckCircle2, Wrench, Award, ChevronRight, Plus, Check, TrendingUp,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { candidatesFor, VENUE_BY_ID, tierFor, TIER_META, TIER_ORDER, VENUE_KINDS } from '../lib/venues'
import { trackVenue, notifySubmissionsChanged } from '../lib/submissions'
import { formatDate } from '../lib/utils'

// Cached per project for the browser session so re-opening a project does not
// spend another API call. "Run again" bypasses it deliberately.
function cacheKey(projectId) {
  return `ai-feedback:${projectId}`
}

function readCache(projectId) {
  try {
    const raw = sessionStorage.getItem(cacheKey(projectId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(projectId, value) {
  try {
    sessionStorage.setItem(cacheKey(projectId), JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode); feedback still works in memory.
  }
}

const TIER_STYLES = {
  fit: 'bg-accent-500/10 text-accent-500 border-accent-500/30',
  safe: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  reach: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
}

function ReadinessBar({ score, label, rationale }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Where this project is
        </span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </div>
      <div className="flex gap-1" role="img" aria-label={`Readiness ${score} out of 5: ${label}`}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= score ? 'bg-brand-500' : 'bg-white/10'}`}
          />
        ))}
      </div>
      {rationale && <p className="text-sm text-zinc-400 mt-2">{rationale}</p>}
    </div>
  )
}

// Score per saved run, oldest first. Shown once there are at least two runs.
function ReadinessHistory({ history }) {
  if (history.length < 2) return null
  const first = history[0]
  const last = history[history.length - 1]
  const delta = last.readiness - first.readiness
  const summary = delta > 0
    ? `Up ${delta} since ${formatDate(first.created_at)}`
    : delta < 0
      ? `Down ${-delta} since ${formatDate(first.created_at)}`
      : `Holding steady since ${formatDate(first.created_at)}`

  return (
    <div className="mb-5 -mt-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <TrendingUp size={13} className={delta > 0 ? 'text-accent-500' : ''} />
        <span>{summary} · {history.length} runs</span>
      </div>
      <div className="flex items-end gap-1 h-8" role="img" aria-label={`Readiness over time: ${history.map(h => h.readiness).join(', ')}`}>
        {history.map(h => (
          <div
            key={h.id}
            title={`${h.readiness}/5 · ${formatDate(h.created_at)}`}
            className="flex-1 max-w-6 rounded-sm bg-brand-500/70"
            style={{ height: `${(h.readiness / 5) * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function VenueRow({ venue, tracked, onTrack, busy }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-colors">
      <a
        href={venue.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex-1 min-w-0"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">
            {venue.name}
          </span>
          <span className="tag">{VENUE_KINDS[venue.kind] || venue.kind}</span>
          <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-400 mt-1">{venue.blurb}</p>
        <p className="text-xs text-zinc-600 mt-1">{venue.timing}</p>
      </a>
      {tracked ? (
        <Link
          to="/tracker"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-accent-500 hover:underline mt-0.5"
        >
          <Check size={13} /> Tracking
        </Link>
      ) : (
        <button
          onClick={onTrack}
          disabled={busy}
          className="btn-secondary shrink-0 text-xs px-3 py-1"
          title="Add to your submission tracker"
        >
          <Plus size={13} /> Track
        </button>
      )}
    </div>
  )
}

export default function AIFeedbackPanel({ project }) {
  const [data, setData] = useState(() => readCache(project.id))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // venue_id -> true for venues this project is already in the tracker for.
  const [trackedIds, setTrackedIds] = useState(() => new Set())
  const [trackingId, setTrackingId] = useState(null)
  const [trackError, setTrackError] = useState('')
  // Saved runs, oldest first: [{ id, readiness, created_at }]
  const [history, setHistory] = useState([])

  // Load the latest saved run (falls back to the session cache if the
  // project_feedback table isn't there yet — see db/migrations/011).
  useEffect(() => {
    supabase
      .from('project_feedback')
      .select('id, readiness, payload, created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data: rows, error: err }) => {
        if (err || !rows?.length) return
        setData(rows[0].payload)
        setHistory(rows.map(({ id, readiness, created_at }) => ({ id, readiness, created_at })).reverse())
      })
  }, [project.id])

  useEffect(() => {
    supabase
      .from('venue_submissions')
      .select('venue_id')
      .eq('project_id', project.id)
      .then(({ data }) => setTrackedIds(new Set((data || []).map(r => r.venue_id))))
  }, [project.id])

  async function track(venueId) {
    setTrackingId(venueId)
    setTrackError('')
    const { error: err } = await trackVenue(project.user_id, project.id, venueId)
    // 23505 = unique violation: already tracked (e.g. from another tab), which is fine.
    if (err && err.code !== '23505') {
      setTrackError('Could not add that to your tracker. Try again.')
    } else {
      setTrackedIds(prev => new Set(prev).add(venueId))
      notifySubmissionsChanged()
    }
    setTrackingId(null)
  }

  async function run() {
    setLoading(true)
    setError('')
    try {
      const candidates = candidatesFor(project.project_type).map(v => ({
        id: v.id,
        name: v.name,
        kind: v.kind,
        selectivity: v.selectivity,
        blurb: v.blurb,
      }))

      const res = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          tech_stack: project.tech_stack || [],
          project_type: project.project_type,
          impact_metrics: project.impact_metrics || '',
          link: project.link || '',
          candidates,
        }),
      })

      const payload = await res.json().catch(() => null)
      if (!payload) {
        throw new Error(
          'Could not reach the feedback service. Run the app with `netlify dev` so /api routes work.'
        )
      }
      if (!res.ok) throw new Error(payload.error || 'Feedback failed to generate.')

      setData(payload)
      writeCache(project.id, payload)

      const { data: saved } = await supabase
        .from('project_feedback')
        .insert({
          project_id: project.id,
          user_id: project.user_id,
          readiness: payload.readiness,
          payload,
        })
        .select('id, readiness, created_at')
        .single()
      if (saved) setHistory(prev => [...prev, saved].slice(-20))
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group the returned venues into tiers using the project's readiness score.
  const tiered = {}
  if (data?.venue_ids?.length) {
    for (const id of data.venue_ids) {
      const venue = VENUE_BY_ID[id]
      if (!venue) continue
      const tier = tierFor(venue, data.readiness)
      ;(tiered[tier] ||= []).push(venue)
    }
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-400" />
          <h2 className="text-lg font-bold text-white">AI feedback</h2>
        </div>
        {data && !loading && (
          <button onClick={run} className="btn-ghost text-sm px-3 py-1.5">
            <RefreshCw size={14} />
            Run again
          </button>
        )}
      </div>

      {!data && !loading && !error && (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            An honest critique of this project, plus where you could actually submit it.
          </p>
          <button onClick={run} className="btn-primary">
            <Sparkles size={16} />
            Get feedback
          </button>
        </>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-6 text-zinc-400">
          <RefreshCw size={16} className="animate-spin text-brand-400" />
          <span className="text-sm">Reviewing your project…</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm mt-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            <button onClick={run} className="underline hover:no-underline mt-1 font-medium">
              Try again
            </button>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="mt-4">
          {data.verdict && (
            <p className="text-[15px] text-zinc-200 leading-relaxed mb-5 pb-5 border-b border-white/10">
              {data.verdict}
            </p>
          )}

          <ReadinessBar
            score={data.readiness}
            label={data.readiness_label}
            rationale={data.readiness_rationale}
          />
          <ReadinessHistory history={history} />

          {data.strengths?.length > 0 && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                <CheckCircle2 size={13} /> Working well
              </h3>
              <ul className="space-y-1.5">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-2">
                    <span className="text-accent-500 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.gaps?.length > 0 && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                <Wrench size={13} /> What to fix next
              </h3>
              <div className="space-y-3">
                {data.gaps.map((g, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0c0c0c] border border-white/10">
                    <p className="text-sm font-medium text-zinc-200">{g.issue}</p>
                    <p className="text-sm text-zinc-400 mt-1.5 flex gap-1.5">
                      <ChevronRight size={14} className="text-brand-400 mt-0.5 shrink-0" />
                      <span>{g.fix}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.skills_demonstrated?.length > 0 && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                <Award size={13} /> Skills this shows
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.skills_demonstrated.map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(tiered).length > 0 && (
            <div className="pt-5 border-t border-white/10">
              <h3 className="text-sm font-bold text-white mb-1">Where to submit it</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Tiers compare each venue's selectivity against how far along your project is.
                Track one to set a deadline and log the result in your{' '}
                <Link to="/tracker" className="text-brand-300 hover:underline">tracker</Link>.
              </p>
              {trackError && <p className="text-xs text-red-300 mb-3">{trackError}</p>}
              <div className="space-y-5">
                {TIER_ORDER.filter(t => tiered[t]?.length).map(tier => (
                  <div key={tier}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge border ${TIER_STYLES[tier]}`}>
                        {TIER_META[tier].label}
                      </span>
                      <span className="text-xs text-zinc-500">{TIER_META[tier].hint}</span>
                    </div>
                    <div className="space-y-2">
                      {tiered[tier].map(v => (
                        <VenueRow
                          key={v.id}
                          venue={v}
                          tracked={trackedIds.has(v.id)}
                          busy={trackingId === v.id}
                          onTrack={() => track(v.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
