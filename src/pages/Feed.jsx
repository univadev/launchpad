import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ProjectCard'
import PostModal from '../components/PostModal'
import { Plus, Zap, RefreshCw, Flame, Rocket } from 'lucide-react'

export default function Feed() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (!profile && !loading) {
      // Profile not set up yet
    }
    if (user && profile === null) {
      // Still loading
    }
  }, [profile, user])

  const fetchProjects = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users!projects_user_id_fkey(id, username, full_name, profile_photo_url, country)
        `)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

      if (error) throw error

      // Fetch reaction counts and user's own reactions
      const enriched = await Promise.all(data.map(async (p) => {
        const [reactionRes, userReactionRes, commentRes, viewRes] = await Promise.all([
          supabase.from('reactions').select('reaction_type').eq('project_id', p.id),
          user ? supabase.from('reactions').select('reaction_type').eq('project_id', p.id).eq('user_id', user.id).single() : Promise.resolve({ data: null }),
          supabase.from('comments').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
          supabase.from('project_views').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
        ])

        const counts = { fire: 0, idea: 0, clap: 0, rocket: 0 }
        reactionRes.data?.forEach(r => { if (counts[r.reaction_type] !== undefined) counts[r.reaction_type]++ })

        return {
          ...p,
          reaction_counts: counts,
          user_reaction: userReactionRes.data?.reaction_type || null,
          comment_count: commentRes.count || 0,
          view_count: viewRes.count || 0,
        }
      }))

      if (reset) {
        setProjects(enriched)
        setPage(1)
      } else {
        setProjects(prev => [...prev, ...enriched])
        setPage(p => p + 1)
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, page])

  useEffect(() => {
    fetchProjects(true)
  }, [user])

  async function handleReactionToggle(projectId, type, currentReaction) {
    if (!user) return

    // Optimistic update
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const counts = { ...p.reaction_counts }

      if (currentReaction === type) {
        // Remove reaction
        counts[type] = Math.max(0, (counts[type] || 0) - 1)
        return { ...p, reaction_counts: counts, user_reaction: null }
      } else {
        // Change/add reaction
        if (currentReaction) counts[currentReaction] = Math.max(0, (counts[currentReaction] || 0) - 1)
        counts[type] = (counts[type] || 0) + 1
        return { ...p, reaction_counts: counts, user_reaction: type }
      }
    }))

    // Real update
    if (currentReaction === type) {
      await supabase.from('reactions').delete()
        .eq('project_id', projectId).eq('user_id', user.id)
    } else {
      await supabase.from('reactions').upsert(
        { project_id: projectId, user_id: user.id, reaction_type: type },
        { onConflict: 'project_id,user_id' }
      )
    }
  }

  function handlePostSuccess(newProject) {
    fetchProjects(true)
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">
              Hi {profile?.full_name?.split(' ')[0] || 'builder'},
            </h1>
            <p className="text-sm text-gray-400">See what's being built right now</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProjects(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              Post
            </button>
          </div>
        </div>

        {/* Streak banner */}
        {profile?.current_streak >= 3 && (
          <div className="flex items-center gap-3 p-3 mb-5 bg-brand-500/10 border border-brand-500/20 rounded-xl">
            <Flame size={24} className="text-brand-400" />
            <div>
              <p className="text-sm font-semibold text-brand-400">{profile.current_streak} day streak!</p>
              <p className="text-xs text-zinc-500">Keep posting to maintain it</p>
            </div>
          </div>
        )}

        {/* Projects */}
        {loading && projects.length === 0 ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800" />
                  <div className="h-4 bg-gray-800 rounded w-32" />
                </div>
                <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-full mb-1" />
                <div className="h-4 bg-gray-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Rocket size={48} className="text-zinc-400 mb-4" />
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Be the first to post!</h2>
            <p className="text-zinc-400 text-sm mb-4">The feed is waiting for your project.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} />
              Share a project
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onReactionToggle={handleReactionToggle}
              />
            ))}

            {hasMore && (
              <button
                onClick={() => fetchProjects(false)}
                disabled={loading}
                className="btn-secondary w-full justify-center py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin-fast" />
                    Loading...
                  </span>
                ) : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <PostModal onClose={() => setShowModal(false)} onSuccess={handlePostSuccess} />
      )}
    </div>
  )
}
