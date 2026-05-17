import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ProjectCard from '../components/ProjectCard'
import { FIELDS_OF_INTEREST, PROJECT_TYPES, COUNTRIES, REACTIONS, timeAgo } from '../lib/utils'
import { Search, X, Trophy, Flame, TrendingUp, Users, Filter, ChevronDown, MapPin } from 'lucide-react'

const TABS = ['Projects', 'Builders', 'Leaderboard']

function LeaderboardSection({ topBuilders, mostReacted, longestStreaks }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Top builders */}
      <div className="card p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-400" />
          Top Builders
          <span className="text-xs text-gray-500 font-normal">by posts</span>
        </h3>
        <div className="flex flex-col gap-2">
          {topBuilders.map((builder, i) => (
            <Link key={builder.id} to={`/@${builder.username}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors group">
              <span className="text-sm font-bold text-gray-500 w-5 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              {builder.profile_photo_url ? (
                <img src={builder.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {builder.full_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{builder.full_name}</p>
                <p className="text-xs text-gray-600">{builder.project_count} projects</p>
              </div>
            </Link>
          ))}
          {topBuilders.length === 0 && <p className="text-sm text-gray-600">No data yet</p>}
        </div>
      </div>

      {/* Most reacted this week */}
      <div className="card p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-accent-400" />
          Hot This Week
          <span className="text-xs text-gray-500 font-normal">most reacted</span>
        </h3>
        <div className="flex flex-col gap-2">
          {mostReacted.map((project, i) => (
            <Link key={project.id} to={`/post/${project.id}`} className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors group">
              <span className="text-sm font-bold text-zinc-500 w-5 text-center mt-0.5 flex items-center justify-center">
                {i === 0 ? <Flame size={14} className="text-brand-400" /> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white leading-snug line-clamp-2">{project.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{project.total_reactions} reactions</p>
              </div>
            </Link>
          ))}
          {mostReacted.length === 0 && <p className="text-sm text-gray-600">No data yet</p>}
        </div>
      </div>

      {/* Longest streaks */}
      <div className="card p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          Streak Leaders
          <span className="text-xs text-gray-500 font-normal">longest streaks</span>
        </h3>
        <div className="flex flex-col gap-2">
          {longestStreaks.map((builder, i) => (
            <Link key={builder.id} to={`/@${builder.username}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors group">
              <span className="text-sm font-bold text-gray-500 w-5 text-center">
                {i + 1}
              </span>
              {builder.profile_photo_url ? (
                <img src={builder.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {builder.full_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{builder.full_name}</p>
                <p className="text-xs text-brand-400 flex items-center gap-1"><Flame size={12} /> {builder.current_streak} days</p>
              </div>
            </Link>
          ))}
          {longestStreaks.length === 0 && <p className="text-sm text-gray-600">No data yet</p>}
        </div>
      </div>
    </div>
  )
}

export default function Discover() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Projects')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ field: '', projectType: '', country: '' })
  const [showFilters, setShowFilters] = useState(false)

  const [projects, setProjects] = useState([])
  const [builders, setBuilders] = useState([])
  const [topBuilders, setTopBuilders] = useState([])
  const [mostReacted, setMostReacted] = useState([])
  const [longestStreaks, setLongestStreaks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [filters, search, activeTab])

  async function fetchData() {
    setLoading(true)
    if (activeTab === 'Projects') await fetchProjects()
    else if (activeTab === 'Builders') await fetchBuilders()
    else await fetchLeaderboard()
    setLoading(false)
  }

  async function fetchProjects() {
    let query = supabase
      .from('projects')
      .select(`*, users!projects_user_id_fkey(id, username, full_name, profile_photo_url, country)`)
      .order('created_at', { ascending: false })
      .limit(30)

    if (filters.projectType) query = query.eq('project_type', filters.projectType)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data } = await query

    // Field filter (via join)
    let filtered = data || []
    if (filters.field) filtered = filtered.filter(p => p.users?.field_of_interest === filters.field || p.tech_stack?.some(t => t.toLowerCase().includes(filters.field.toLowerCase())))
    if (filters.country) filtered = filtered.filter(p => p.users?.country === filters.country)

    // Enrich with reactions
    const enriched = await Promise.all(filtered.map(async p => {
      const [reactionRes, userReactionRes, commentRes] = await Promise.all([
        supabase.from('reactions').select('reaction_type').eq('project_id', p.id),
        user ? supabase.from('reactions').select('reaction_type').eq('project_id', p.id).eq('user_id', user.id).single() : Promise.resolve({ data: null }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
      ])
      const counts = { fire: 0, idea: 0, clap: 0, rocket: 0 }
      reactionRes.data?.forEach(r => { if (counts[r.reaction_type] !== undefined) counts[r.reaction_type]++ })
      return {
        ...p,
        reaction_counts: counts,
        user_reaction: userReactionRes.data?.reaction_type || null,
        comment_count: commentRes.count || 0,
      }
    }))
    setProjects(enriched)
  }

  async function fetchBuilders() {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (filters.field) query = query.eq('field_of_interest', filters.field)
    if (filters.country) query = query.eq('country', filters.country)
    if (search) {
      // strip @ prefix and any PostgREST `or()` delimiters/wildcards that would break parsing
      const s = search.replace(/^@/, '').replace(/[,()*]/g, '')
      if (s) {
        query = query.or(`full_name.ilike.%${s}%,username.ilike.%${s}%`)
      }
    }

    const { data } = await query
    setBuilders(data || [])
  }

  async function fetchLeaderboard() {
    // Top builders by project count
    const { data: allProjects } = await supabase
      .from('projects')
      .select('user_id, users!projects_user_id_fkey(id, username, full_name, profile_photo_url)')

    const builderMap = {}
    allProjects?.forEach(p => {
      const u = p.users
      if (!u) return
      if (!builderMap[u.id]) builderMap[u.id] = { ...u, project_count: 0 }
      builderMap[u.id].project_count++
    })
    setTopBuilders(
      Object.values(builderMap)
        .sort((a, b) => b.project_count - a.project_count)
        .slice(0, 7)
    )

    // Most reacted this week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: weekProjects } = await supabase
      .from('projects')
      .select('id, title')
      .gte('created_at', weekAgo)
      .limit(50)

    const reactionCounts = await Promise.all((weekProjects || []).map(async p => {
      const { count } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)
      return { ...p, total_reactions: count || 0 }
    }))
    setMostReacted(reactionCounts.sort((a, b) => b.total_reactions - a.total_reactions).slice(0, 7))

    // Longest streaks
    const { data: streakUsers } = await supabase
      .from('users')
      .select('id, username, full_name, profile_photo_url, current_streak')
      .gt('current_streak', 0)
      .order('current_streak', { ascending: false })
      .limit(7)
    setLongestStreaks(streakUsers || [])
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
          <p className="text-gray-400 text-sm">Find builders and projects from around the world</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="input pl-9"
              placeholder={activeTab === 'Builders' ? 'Search builders by name or @username...' : 'Search projects...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${activeFiltersCount > 0 ? 'border-brand-600 text-brand-300' : ''}`}
          >
            <Filter size={15} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-5 grid sm:grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Field of interest</label>
              <select className="input text-sm" value={filters.field} onChange={e => setFilters(f => ({ ...f, field: e.target.value }))}>
                <option value="">All fields</option>
                {FIELDS_OF_INTEREST.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Project type</label>
              <select className="input text-sm" value={filters.projectType} onChange={e => setFilters(f => ({ ...f, projectType: e.target.value }))}>
                <option value="">All types</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
              <select className="input text-sm" value={filters.country} onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}>
                <option value="">All countries</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => setFilters({ field: '', projectType: '', country: '' })}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <X size={12} />Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 border border-gray-800 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
          </div>
        ) : activeTab === 'Projects' ? (
          <div className="flex flex-col gap-4">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No projects found matching your filters.</div>
            ) : (
              projects.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))
            )}
          </div>
        ) : activeTab === 'Builders' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builders.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-500">No builders found.</div>
            ) : builders.map(builder => (
              <Link key={builder.id} to={`/@${builder.username}`} className="card p-4 hover:border-gray-700 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  {builder.profile_photo_url ? (
                    <img src={builder.profile_photo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-700 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {builder.full_name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate">{builder.full_name}</p>
                    <p className="text-xs text-gray-500">@{builder.username}</p>
                  </div>
                </div>
                {builder.field_of_interest && (
                  <span className="badge bg-brand-900/50 text-brand-300  text-xs mb-2">{builder.field_of_interest}</span>
                )}
                {builder.goal && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{builder.goal}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-zinc-600">
                  {builder.country && <span className="flex items-center gap-1"><MapPin size={12} /> {builder.country}</span>}
                  {builder.current_streak > 0 && <span className="flex items-center gap-1"><Flame size={12} /> {builder.current_streak}d streak</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <LeaderboardSection
            topBuilders={topBuilders}
            mostReacted={mostReacted}
            longestStreaks={longestStreaks}
          />
        )}
      </div>
    </div>
  )
}
