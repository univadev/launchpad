import { useState } from 'react'
import {
  Sparkles, AlertCircle, RefreshCw, ExternalLink,
  CheckCircle2, Wrench, Award, ChevronRight,
} from 'lucide-react'
import { candidatesFor, VENUE_BY_ID, tierFor, TIER_META, TIER_ORDER, VENUE_KINDS } from '../lib/venues'

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

function VenueRow({ venue }) {
  return (
    <a
      href={venue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-3 rounded-lg bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">
            {venue.name}
          </span>
          <span className="tag">{VENUE_KINDS[venue.kind] || venue.kind}</span>
        </div>
        <p className="text-sm text-zinc-400 mt-1">{venue.blurb}</p>
        <p className="text-xs text-zinc-600 mt-1">{venue.timing}</p>
      </div>
      <ExternalLink size={14} className="text-zinc-600 group-hover:text-zinc-300 mt-1 shrink-0" />
    </a>
  )
}

export default function AIFeedbackPanel({ project }) {
  const [data, setData] = useState(() => readCache(project.id))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
              </p>
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
                      {tiered[tier].map(v => <VenueRow key={v.id} venue={v} />)}
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
