import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { unlocksAtNextLevel, reachableNow } from '../lib/venues'
import { TrendingUp, Sparkles, ChevronRight, Lock } from 'lucide-react'

const LEVELS = {
  1: 'Idea stage',
  2: 'Early build',
  3: 'Working project',
  4: 'Polished & validated',
  5: 'Competition ready',
}

// Per project: where it is (latest saved AI feedback), the one thing to fix
// next, and which venues open up at the next readiness level.
export default function NextSteps({ userId, country }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase
        .from('projects')
        .select('id, title, project_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6),
      // Optional (migration 011); without it every project shows "not reviewed".
      supabase
        .from('project_feedback')
        .select('project_id, readiness, payload, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: projects }, { data: feedback }]) => {
      const latest = {}
      for (const f of feedback || []) if (!latest[f.project_id]) latest[f.project_id] = f
      setRows((projects || []).map(p => ({ project: p, feedback: latest[p.id] || null })))
    })
  }, [userId])

  if (!rows) return null
  if (!rows.length) {
    return (
      <div className="card p-5 mb-8 text-sm text-zinc-400">
        Post your first project from the <Link to="/feed" className="text-brand-300 hover:underline">feed</Link>,
        then run AI feedback on it to see your path from here.
      </div>
    )
  }

  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3 flex items-center gap-2">
        <TrendingUp size={13} /> Next steps
      </h2>
      <div className="space-y-3">
        {rows.map(({ project, feedback }) => {
          if (!feedback) {
            return (
              <div key={project.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{project.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Not reviewed yet</p>
                </div>
                <Link to={`/post/${project.id}`} className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                  <Sparkles size={13} /> Get feedback
                </Link>
              </div>
            )
          }

          const level = feedback.readiness
          const nextFix = feedback.payload?.gaps?.[0]
          const unlocks = unlocksAtNextLevel(project.project_type, level, country).slice(0, 3)
          const nowCount = reachableNow(project.project_type, level, country).length

          return (
            <div key={project.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/post/${project.id}`} className="font-semibold text-white hover:text-brand-300 min-w-0 truncate">
                  {project.title}
                </Link>
                <span className="text-xs text-zinc-400 shrink-0">
                  Level {level}/5 · {LEVELS[level]}
                </span>
              </div>
              <div className="flex gap-1 mt-2" aria-hidden="true">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= level ? 'bg-brand-500' : 'bg-white/10'}`} />
                ))}
              </div>

              {nextFix && (
                <p className="text-sm text-zinc-300 mt-3 flex gap-1.5">
                  <ChevronRight size={14} className="text-brand-400 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-500">Next:</span> {nextFix.fix}</span>
                </p>
              )}

              <p className="text-xs text-zinc-500 mt-3">
                {nowCount > 0
                  ? `${nowCount} venue${nowCount === 1 ? ' is' : 's are'} a realistic target now — see them in the project's AI feedback.`
                  : 'Run AI feedback again after improving it to see where it fits.'}
              </p>
              {level < 5 && unlocks.length > 0 && (
                <p className="text-xs text-zinc-400 mt-1.5 flex gap-1.5">
                  <Lock size={12} className="mt-0.5 shrink-0 text-zinc-500" />
                  <span>
                    Reach level {level + 1} ({LEVELS[level + 1]}) to make{' '}
                    {unlocks.map(v => v.name).join(', ')} a realistic target.
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
