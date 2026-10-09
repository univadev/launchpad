import { Link, useParams, Navigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'
import { GUIDES, GUIDE_BY_SLUG } from '../lib/guides'
import { VENUE_BY_ID, VENUE_KINDS, isEligible, seasonCalendar } from '../lib/venues'
import { BookOpen, Clock, ArrowLeft, ExternalLink, CalendarDays, ChevronRight } from 'lucide-react'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

// In-app links use the router; everything else opens in a new tab.
function MarkdownLink({ href = '', children }) {
  if (href.startsWith('/')) return <Link to={href}>{children}</Link>
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

function SeasonCalendar({ country }) {
  const months = seasonCalendar(country)
  if (!months.length) return null
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
        <CalendarDays size={18} /> The year ahead
      </h2>
      <p className="text-sm text-zinc-500 mb-4">
        Typical timing only — dates change every year, so always confirm on the official site.
        {!country && <> <Link to="/settings" className="text-brand-300 hover:underline">Add your country</Link> to hide ones you can't enter.</>}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {months.map(({ month, venues }) => (
          <div key={month} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">{MONTH_NAMES[month - 1]}</p>
            <ul className="space-y-1.5">
              {venues.map(v => (
                <li key={v.id} className="text-sm">
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-brand-300">
                    {v.name}
                  </a>
                  <span className="text-xs text-zinc-600"> · {v.timing}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function GuideList() {
  const { profile } = useAuth()
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} /> Guides
        </h1>
        <p className="text-sm text-zinc-400 mt-1 mb-6">
          Short, practical advice for turning projects into results — and results into stronger applications.
        </p>
        <div className="space-y-3">
          {GUIDES.map(g => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="card p-5 block group">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white group-hover:text-brand-300 transition-colors">{g.title}</h2>
                  <p className="text-sm text-zinc-400 mt-1">{g.summary}</p>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1"><Clock size={11} /> {g.minutes} min read</p>
            </Link>
          ))}
        </div>
        <SeasonCalendar country={profile?.country || ''} />
      </div>
    </div>
  )
}

function GuideDetail({ guide }) {
  const { user, profile } = useAuth()
  const country = profile?.country || ''
  const venues = guide.venues
    .map(id => VENUE_BY_ID[id])
    .filter(v => v && isEligible(v, country))

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to="/guides" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
          <ArrowLeft size={15} /> All guides
        </Link>
        <h1 className="text-2xl font-bold text-white leading-tight">{guide.title}</h1>
        <p className="text-xs text-zinc-600 mt-2 mb-6 flex items-center gap-1"><Clock size={11} /> {guide.minutes} min read</p>

        <article className="prose-dark">
          <ReactMarkdown components={{ a: MarkdownLink }}>{guide.body}</ReactMarkdown>
        </article>

        {venues.length > 0 && (
          <div className="card p-5 mt-8">
            <h2 className="text-sm font-semibold text-white mb-3">Where this applies</h2>
            <div className="space-y-2">
              {venues.map(v => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 rounded-lg bg-[#0c0c0c] border border-white/10 hover:border-white/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm group-hover:text-brand-300">{v.name}</span>
                      <span className="tag">{VENUE_KINDS[v.kind] || v.kind}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{v.timing}</p>
                  </div>
                  <ExternalLink size={14} className="text-zinc-600 mt-1 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          {user ? (
            <>
              <Link to="/tracker" className="btn-secondary text-sm">See your path</Link>
              <Link to="/coach" className="btn-secondary text-sm">Open the application coach</Link>
            </>
          ) : (
            <Link to="/signup" className="btn-primary text-sm">Join Launchpad</Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Guides() {
  const { slug } = useParams()
  if (!slug) return <GuideList />
  const guide = GUIDE_BY_SLUG[slug]
  return guide ? <GuideDetail guide={guide} /> : <Navigate to="/guides" replace />
}
