import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, X, Briefcase, Wifi, Send, Users, Zap, Compass, ArrowRight } from 'lucide-react'
import InternshipCard from '../components/InternshipCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const FIELDS = ['All', 'Software', 'Design', 'Data', 'Product', 'Marketing']

const HOW_IT_WORKS = [
  { step: 1, icon: Compass, title: 'Browse opportunities', desc: 'Explore curated listings from vetted startups across software, design, data, product, and more.' },
  { step: 2, icon: Send,    title: 'Apply through Launchpad', desc: 'Submit your application directly in Launchpad. No external portals or separate accounts.' },
  { step: 3, icon: Users,   title: 'Team reviews applicants', desc: 'The Launchpad team evaluates every application and selects the strongest candidates.' },
  { step: 4, icon: Zap,     title: 'Top applicants get introduced', desc: 'Shortlisted builders receive a warm introduction directly to the startup hiring team.' },
]

export const INTERNSHIPS = [
  {
    id: 'int-001',
    company: 'Buildspace',
    role: 'Software Engineering Intern',
    description: 'Join the core team to build next-generation tools for builders. Work on full-stack features shipped to thousands of users each week alongside a tight-knit engineering team.',
    location: 'San Francisco, CA',
    remote: true,
    duration: '10 weeks',
    stipend: '$2,500 / mo',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    field: 'Software',
    bgColor: '#2563eb',
    featured: true,
  },
  {
    id: 'int-002',
    company: 'Luma AI',
    role: 'Product Design Intern',
    description: 'Help shape the future of generative AI interfaces. Own end-to-end design sprints and ship work to production alongside a small, fast-moving product team.',
    location: 'New York, NY',
    remote: true,
    duration: '12 weeks',
    stipend: '$2,000 / mo',
    tags: ['Figma', 'UX Research', 'Prototyping'],
    field: 'Design',
    bgColor: '#7c3aed',
    featured: false,
  },
  {
    id: 'int-003',
    company: 'Perplexity',
    role: 'Data Science Intern',
    description: 'Work with the ML team to improve search relevance and ranking models. Analyze large-scale query logs and run experiments that directly affect millions of searches per day.',
    location: 'Remote',
    remote: true,
    duration: '8 weeks',
    stipend: '$3,000 / mo',
    tags: ['Python', 'SQL', 'Machine Learning'],
    field: 'Data',
    bgColor: '#0d9488',
    featured: true,
  },
  {
    id: 'int-004',
    company: 'Linear',
    role: 'Frontend Engineering Intern',
    description: 'Work on one of the most respected developer tools in the industry. Contribute to performance improvements, new UI features, and the Linear SDK used by thousands of dev teams.',
    location: 'San Francisco, CA',
    remote: false,
    duration: '10 weeks',
    stipend: '$2,800 / mo',
    tags: ['TypeScript', 'React', 'GraphQL'],
    field: 'Software',
    bgColor: '#4f46e5',
    featured: false,
  },
  {
    id: 'int-005',
    company: 'Notion',
    role: 'Growth Marketing Intern',
    description: 'Drive user acquisition and activation experiments for the creator community. Run A/B tests, analyze funnels, and partner with product on launch campaigns and content strategy.',
    location: 'San Francisco, CA',
    remote: true,
    duration: '12 weeks',
    stipend: '$1,800 / mo',
    tags: ['Analytics', 'Copywriting', 'SEO'],
    field: 'Marketing',
    bgColor: '#57534e',
    featured: false,
  },
  {
    id: 'int-006',
    company: 'Vercel',
    role: 'Product Management Intern',
    description: 'Embed with the platform team to define, ship, and measure features for the deployment pipeline. Work cross-functionally across engineering, design, and go-to-market.',
    location: 'Remote',
    remote: true,
    duration: '12 weeks',
    stipend: '$2,200 / mo',
    tags: ['Product Strategy', 'Roadmapping', 'Data Analysis'],
    field: 'Product',
    bgColor: '#3f3f46',
    featured: false,
  },
]


export default function Internships() {
  const { user } = useAuth()
  const [search, setSearch]           = useState('')
  const [activeField, setActiveField] = useState('All')
  const [remoteOnly, setRemoteOnly]   = useState(false)
  const [appliedIds, setAppliedIds]   = useState(new Set())

  const boardRef = useRef(null)
  const howRef   = useRef(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('applications')
      .select('internship_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data?.length) setAppliedIds(new Set(data.map(a => a.internship_id)))
      })
  }, [user])

  const filtered = useMemo(() => {
    return INTERNSHIPS.filter(i => {
      if (activeField !== 'All' && i.field !== activeField) return false
      if (remoteOnly && !i.remote) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          i.company.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q) ||
          i.tags.some(t => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [search, activeField, remoteOnly])

  const remoteCount  = INTERNSHIPS.filter(i => i.remote).length
  const companyCount = new Set(INTERNSHIPS.map(i => i.company)).size
  const isFiltering  = search || activeField !== 'All' || remoteOnly

  return (
    <div className="min-h-screen">

      {/* ════════════════════════════════════════
          HERO — two-column layout
      ════════════════════════════════════════ */}
      <section className="relative pt-14 overflow-hidden">

        {/* Hero image as full-section background — masked to right half on desktop, full bg on mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="/internships-hero.png"
            alt=""
            className="absolute top-0 right-0 h-full w-auto max-w-none object-cover object-left"
            style={{ minWidth: '55%' }}
          />
          {/* Fade the image into the dark bg on the left */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #0a0a0a 30%, rgba(10,10,10,0.65) 55%, rgba(10,10,10,0.15) 100%)',
            }}
          />
          {/* Fade bottom into page */}
          <div
            className="absolute bottom-0 inset-x-0 h-32"
            style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center py-20 lg:py-28">

            {/* ── Left: copy ── */}
            <div className="flex flex-col gap-6">

              {/* Pill badge */}
              <div className="inline-flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-full
                bg-brand-600/10 border border-brand-600/25 text-brand-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                {INTERNSHIPS.length} opportunities open now
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.12] tracking-tight">
                Startup internships,<br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #f0b6a0 0%, #d95d39 45%, #b54a2b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  matched through<br />Launchpad.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-md">
                Browse curated opportunities from vetted startups, apply through your Launchpad profile, and get introduced to the teams that matter.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="btn-primary px-6 py-2.5 text-sm shadow-lg"
                  style={{ boxShadow: '0 0 24px rgba(217,93,57,0.30)' }}
                >
                  Browse Opportunities
                </button>
                <button
                  onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold
                    text-zinc-300 hover:text-white border border-white/10 hover:border-white/25
                    hover:bg-white/5 transition-all duration-150"
                >
                  How it Works
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-6 pt-2">
                {[
                  { value: INTERNSHIPS.length, label: 'Opportunities' },
                  { value: remoteCount,         label: 'Remote OK' },
                  { value: companyCount,        label: 'Companies' },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-6">
                    {i > 0 && <div className="w-px h-7 bg-white/10" />}
                    <div>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: empty — image fills this space via the absolute background ── */}
            <div className="hidden lg:block" />

          </div>
        </div>

      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section ref={howRef} className="relative py-20 border-y border-white/[0.05]"
        style={{ background: 'linear-gradient(to bottom, #0a0a0a, #0d0d0d, #0a0a0a)' }}>
        <div className="max-w-5xl mx-auto px-4">

          {/* Section label */}
          <div className="flex flex-col items-center mb-12">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">
              How it works
            </p>
            <h2 className="text-2xl font-bold text-white text-center">
              From application to introduction
            </h2>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="relative flex flex-col gap-4 p-6 group"
                style={{ background: '#0d0d0d' }}
              >
                {/* Step number */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center
                      text-[11px] font-bold text-brand-300 border border-brand-600/30 shrink-0"
                    style={{ background: 'rgba(217,93,57,0.08)' }}
                  >
                    {step}
                  </div>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: step < 4
                        ? 'linear-gradient(to right, rgba(217,93,57,0.2), transparent)'
                        : 'transparent',
                    }}
                  />
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center
                    border border-brand-600/20 group-hover:border-brand-600/40 transition-colors"
                  style={{ background: 'rgba(217,93,57,0.07)' }}
                >
                  <Icon size={18} className="text-brand-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-100 mb-1.5">{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          OPPORTUNITY BOARD
      ════════════════════════════════════════ */}
      <section ref={boardRef} className="max-w-5xl mx-auto px-4 py-14">

        {/* Board header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.18em] mb-1">
              Open opportunities
            </p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">All Listings</h2>
              <span className="badge bg-brand-900/50 text-brand-300 border border-brand-700/30 text-xs">
                {INTERNSHIPS.length} open
              </span>
            </div>
          </div>
        </div>

        {/* Search + remote toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              className="input pl-9 text-sm"
              placeholder="Search by role, company, or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              remoteOnly
                ? 'bg-accent-600/20 text-accent-500 border-accent-600/30'
                : 'bg-zinc-800 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <Wifi size={14} />
            Remote only
          </button>
        </div>

        {/* Field filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FIELDS.map(field => (
            <button
              key={field}
              onClick={() => setActiveField(field)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeField === field
                  ? 'bg-brand-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {field}
            </button>
          ))}
        </div>

        {/* Results meta */}
        {isFiltering && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              {activeField !== 'All' && ` in ${activeField}`}
              {remoteOnly && ' · Remote only'}
              {search && ` for "${search}"`}
            </p>
            <button
              onClick={() => { setSearch(''); setActiveField('All'); setRemoteOnly(false) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <X size={11} />
              Clear
            </button>
          </div>
        )}

        {/* Grid / empty state */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium mb-1">No results found</p>
            <p className="text-zinc-500 text-sm">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setSearch(''); setActiveField('All'); setRemoteOnly(false) }}
              className="btn-secondary mt-4 text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(internship => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                applied={appliedIds.has(internship.id)}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
