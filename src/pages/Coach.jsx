import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { postApi } from '../lib/api'
import { programById } from '../lib/admissionsData'
import { VENUE_BY_ID } from '../lib/venues'
import { STATUS_META, WIN_STATUSES } from '../lib/submissions'
import {
  GraduationCap, Sparkles, AlertCircle, RefreshCw, Lightbulb, AlertTriangle,
  CheckCircle2, Wrench, ChevronRight, HelpCircle,
} from 'lucide-react'

const OTHER_PROGRAM = '__other'

// Inputs are worth keeping across a refresh, per user, in this browser only.
function inputsKey(userId) {
  return `coach-inputs:${userId}`
}

function readInputs(userId) {
  try {
    const raw = localStorage.getItem(inputsKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function countWords(text) {
  return (text.match(/\S+/g) || []).length
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
        <Icon size={13} /> {title}
      </h3>
      {children}
    </div>
  )
}

function Bullets({ items, tone = 'text-zinc-300' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className={`text-sm ${tone} flex gap-2`}>
          <span className="text-zinc-600 mt-0.5">•</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

function PlanResult({ data }) {
  return (
    <>
      {data.angle && (
        <p className="text-[15px] text-zinc-200 leading-relaxed mb-5 pb-5 border-b border-white/10">{data.angle}</p>
      )}
      {data.points.length > 0 && (
        <Section icon={Lightbulb} title="Talking points">
          <div className="space-y-3">
            {data.points.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0c0c0c] border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">{p.point}</p>
                  {p.evidence && <span className="tag shrink-0">{p.evidence}</span>}
                </div>
                {p.why && (
                  <p className="text-sm text-zinc-400 mt-1.5 flex gap-1.5">
                    <ChevronRight size={14} className="text-brand-400 mt-0.5 shrink-0" />
                    <span>{p.why}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.gaps.length > 0 && (
        <Section icon={HelpCircle} title="Not in your record yet">
          <Bullets items={data.gaps} />
        </Section>
      )}
      {data.cautions.length > 0 && (
        <Section icon={AlertTriangle} title="Avoid">
          <Bullets items={data.cautions} />
        </Section>
      )}
    </>
  )
}

function ReviewResult({ data, limit }) {
  return (
    <>
      <p className={`text-xs mb-3 ${data.over_limit ? 'text-red-300' : 'text-zinc-500'}`}>
        {data.words} words{limit ? ` / ${limit} limit` : ''}{data.over_limit ? ' — over the limit' : ''}
      </p>
      {data.verdict && (
        <p className="text-[15px] text-zinc-200 leading-relaxed mb-5 pb-5 border-b border-white/10">{data.verdict}</p>
      )}
      {data.strengths.length > 0 && (
        <Section icon={CheckCircle2} title="Working well">
          <Bullets items={data.strengths} />
        </Section>
      )}
      {data.issues.length > 0 && (
        <Section icon={Wrench} title="What to change">
          <div className="space-y-3">
            {data.issues.map((g, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0c0c0c] border border-white/10">
                <p className="text-sm font-medium text-zinc-200">{g.issue}</p>
                <p className="text-sm text-zinc-400 mt-1.5 flex gap-1.5">
                  <ChevronRight size={14} className="text-brand-400 mt-0.5 shrink-0" />
                  <span>{g.fix}</span>
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.unsupported.length > 0 && (
        <Section icon={AlertTriangle} title="Claims your record doesn't back up">
          <Bullets items={data.unsupported} tone="text-amber-200/90" />
        </Section>
      )}
      {data.unused.length > 0 && (
        <Section icon={Lightbulb} title="Strong things you left out">
          <Bullets items={data.unused} />
        </Section>
      )}
    </>
  )
}

export default function Coach() {
  const { user, profile } = useAuth()
  const saved = useMemo(() => readInputs(user?.id), [user?.id])

  const [projects, setProjects] = useState([])
  const [wins, setWins] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [loadingRecord, setLoadingRecord] = useState(true)

  const ranked = (profile?.admissions_profile?.programs || [])
    .map(p => programById(p.programId))
    .filter(Boolean)
  const activities = (profile?.admissions_profile?.extracurriculars || [])
    .filter(a => a.description?.trim())

  const [mode, setMode] = useState(saved.mode || 'plan')
  const [programId, setProgramId] = useState(saved.programId || ranked[0]?.id || OTHER_PROGRAM)
  const [otherProgram, setOtherProgram] = useState(saved.otherProgram || '')
  const [question, setQuestion] = useState(saved.question || '')
  const [wordLimit, setWordLimit] = useState(saved.wordLimit || '')
  const [draft, setDraft] = useState(saved.draft || '')

  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(inputsKey(user?.id), JSON.stringify({ mode, programId, otherProgram, question, wordLimit, draft }))
    } catch {
      // Storage unavailable; inputs just won't survive a refresh.
    }
  }, [user?.id, mode, programId, otherProgram, question, wordLimit, draft])

  useEffect(() => {
    if (user) loadRecord()
  }, [user?.id])

  async function loadRecord() {
    setLoadingRecord(true)
    const [{ data: projectRows }, { data: winRows }, { data: feedbackRows }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, title, description, project_type, impact_metrics, tech_stack')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('venue_submissions')
        .select('id, venue_id, status, result_note, projects(title)')
        .eq('user_id', user.id)
        .in('status', WIN_STATUSES),
      // Optional (migration 011); ignored if the table isn't there.
      supabase
        .from('project_feedback')
        .select('project_id, payload, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    const latestLabel = {}
    for (const f of feedbackRows || []) {
      if (!latestLabel[f.project_id]) latestLabel[f.project_id] = f.payload?.readiness_label
    }

    const list = (projectRows || []).map(p => ({ ...p, readiness: latestLabel[p.id] || '' }))
    setProjects(list)
    setSelected(new Set(list.slice(0, 8).map(p => p.id)))
    setWins(winRows || [])
    setLoadingRecord(false)
  }

  function toggleProject(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 8) next.add(id)
      return next
    })
  }

  // Evidence in the exact order the server numbers it, so P1/R1/A1 line up.
  const chosenProjects = projects.filter(p => selected.has(p.id))
  const programName = programId === OTHER_PROGRAM
    ? otherProgram.trim()
    : (() => { const p = programById(programId); return p ? `${p.name} at ${p.university}` : '' })()
  const limit = parseInt(wordLimit, 10) || null

  async function run() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await postApi('application-coach', {
        mode,
        program: programName,
        question,
        word_limit: limit,
        draft: mode === 'review' ? draft : '',
        evidence: {
          projects: chosenProjects.map(p => ({
            title: p.title,
            type: p.project_type,
            description: p.description,
            impact: p.impact_metrics || '',
            tech: p.tech_stack || [],
            readiness: p.readiness,
          })),
          wins: wins.map(w => ({
            venue: VENUE_BY_ID[w.venue_id]?.name || w.venue_id,
            result: w.result_note || STATUS_META[w.status].label,
            project: w.projects?.title || '',
          })),
          activities: activities.map(a => ({ type: a.type, description: a.description })),
        },
      })
      const payload = await res.json().catch(() => null)
      if (!payload) throw new Error('Could not reach the coach. Run the app with `netlify dev` so /api routes work.')
      if (!res.ok) throw new Error(payload.error || 'The coach failed to respond.')
      setResult(payload)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setRunning(false)
    }
  }

  const canRun = question.trim() && programName && (mode === 'plan' || countWords(draft) >= 15)
  const hasRecord = projects.length > 0 || wins.length > 0 || activities.length > 0

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <GraduationCap size={20} />
          Application coach
        </h1>
        <p className="text-sm text-zinc-400 mt-1 mb-6">
          Paste a question from a university application. The coach plans an answer from your real projects,
          results and activities, or reviews your draft. It won't write the answer for you — that has to be yours.
        </p>

        <div className="grid md:grid-cols-[1fr_260px] gap-6">
          {/* Inputs */}
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex gap-1 bg-zinc-900 border border-gray-800 rounded-xl p-1">
              {[['plan', 'Plan an answer'], ['review', 'Review my draft']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setResult(null) }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === key ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-300">
              Program
              <select value={programId} onChange={e => setProgramId(e.target.value)} className="input mt-1.5">
                {ranked.map(p => <option key={p.id} value={p.id}>{p.name} — {p.university}</option>)}
                <option value={OTHER_PROGRAM}>Another program…</option>
              </select>
            </label>
            {programId === OTHER_PROGRAM && (
              <input
                className="input"
                value={otherProgram}
                maxLength={150}
                onChange={e => setOtherProgram(e.target.value)}
                placeholder="e.g. Computer Engineering at University of Ottawa"
              />
            )}

            <label className="block text-sm font-medium text-gray-300">
              Question from the application
              <textarea
                className="input resize-y mt-1.5"
                rows={3}
                maxLength={1500}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Paste the question exactly as it appears on the form"
              />
            </label>

            <label className="block text-sm font-medium text-gray-300 w-40">
              Word limit <span className="text-gray-600 font-normal">(optional)</span>
              <input
                type="number"
                min="1"
                max="2000"
                className="input mt-1.5"
                value={wordLimit}
                onChange={e => setWordLimit(e.target.value)}
              />
            </label>

            {mode === 'review' && (
              <label className="block text-sm font-medium text-gray-300">
                Your draft
                <textarea
                  className="input resize-y mt-1.5"
                  rows={9}
                  maxLength={6000}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Write your own answer here, then get feedback on it"
                />
                <span className={`text-xs mt-1 block ${limit && countWords(draft) > limit ? 'text-red-300' : 'text-zinc-500'}`}>
                  {countWords(draft)} words{limit ? ` / ${limit}` : ''}
                </span>
              </label>
            )}

            <div>
              <button onClick={run} disabled={!canRun || running} className="btn-primary">
                {running ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {running ? 'Thinking…' : mode === 'plan' ? 'Plan my answer' : 'Review my draft'}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {result && !running && (
              <div className="card p-6">
                {result.mode === 'plan' ? <PlanResult data={result} /> : <ReviewResult data={result} limit={limit} />}
              </div>
            )}
          </div>

          {/* Evidence */}
          <aside className="card p-4 h-fit">
            <h2 className="text-sm font-semibold text-white mb-1">Your record</h2>
            <p className="text-xs text-zinc-500 mb-3">The only facts the coach uses. Cited as P1, R1, A1.</p>

            {loadingRecord ? (
              <p className="text-xs text-zinc-500">Loading…</p>
            ) : !hasRecord ? (
              <p className="text-xs text-zinc-400">
                Nothing yet. Post a project from your <Link to="/feed" className="text-brand-300 hover:underline">feed</Link> or
                add activities to your admissions profile in <Link to="/settings" className="text-brand-300 hover:underline">Settings</Link>.
              </p>
            ) : (
              <div className="space-y-4 text-xs">
                {projects.length > 0 && (
                  <div>
                    <p className="text-zinc-500 mb-1.5">Projects (up to 8)</p>
                    <div className="space-y-1.5">
                      {projects.map(p => {
                        const index = chosenProjects.findIndex(c => c.id === p.id)
                        return (
                          <label key={p.id} className="flex items-start gap-2 text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => toggleProject(p.id)}
                              className="mt-0.5 accent-brand-500"
                            />
                            <span>
                              {index >= 0 && <span className="text-brand-300 font-medium">P{index + 1} </span>}
                              {p.title}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
                {wins.length > 0 && (
                  <div>
                    <p className="text-zinc-500 mb-1.5">Results</p>
                    {wins.slice(0, 10).map((w, i) => (
                      <p key={w.id} className="text-zinc-300">
                        <span className="text-brand-300 font-medium">R{i + 1} </span>
                        {VENUE_BY_ID[w.venue_id]?.name || w.venue_id}
                      </p>
                    ))}
                  </div>
                )}
                {activities.length > 0 && (
                  <div>
                    <p className="text-zinc-500 mb-1.5">Activities</p>
                    {activities.slice(0, 12).map((a, i) => (
                      <p key={a.uid || i} className="text-zinc-300 truncate" title={a.description}>
                        <span className="text-brand-300 font-medium">A{i + 1} </span>
                        {a.type || a.description}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
