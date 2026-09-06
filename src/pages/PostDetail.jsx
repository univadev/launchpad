import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { timeAgo, formatDate } from '../lib/utils'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ExternalLink, MessageSquare, Send, Trash2, Reply, Clock, AlertCircle, ThumbsUp, X, Eye } from 'lucide-react'
import { recordView } from '../lib/viewTracker'
import AIFeedbackPanel from '../components/AIFeedbackPanel'

function CommentItem({ comment, depth = 0, onReply, onDelete, currentUserId }) {
  const author = comment.users || {}
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-gray-800 pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/@${author.username}`} className="flex items-center gap-2 group">
            {author.profile_photo_url ? (
              <img src={author.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-700" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {author.full_name?.[0] || '?'}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-200 group-hover:text-white">{author.full_name}</span>
            <span className="text-xs text-gray-600">@{author.username}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock size={11} />{timeAgo(comment.created_at)}
            </span>
            {depth === 0 && (
              <button
                onClick={() => onReply?.(comment)}
                className="text-xs text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1"
              >
                <Reply size={12} />Reply
              </button>
            )}
            {currentUserId === comment.user_id && (
              <button
                onClick={() => onDelete?.(comment.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
      </div>
      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [comments, setComments] = useState([])
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProject()
    fetchComments()
  }, [id])

  useEffect(() => {
    if (!project?.id) return
    const timer = setTimeout(async () => {
      const recorded = await recordView(project.id, user?.id)
      if (recorded) setViewCount(c => c + 1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [project?.id])

  async function fetchProject() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select(`*, users!projects_user_id_fkey(id, username, full_name, profile_photo_url, country, field_of_interest, goal)`)
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('Project not found')
      setLoading(false)
      return
    }

    setProject(data)

    const [{ data: reactions }, { count: views }] = await Promise.all([
      supabase.from('reactions').select('user_id').eq('project_id', id),
      supabase.from('project_views').select('*', { count: 'exact', head: true }).eq('project_id', id),
    ])

    setUpvoteCount(reactions?.length || 0)
    setViewCount(views || 0)
    if (user) {
      setHasUpvoted(!!reactions?.find(r => r.user_id === user.id))
    }

    setLoading(false)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select(`*, users!comments_user_id_fkey(id, username, full_name, profile_photo_url)`)
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    // Thread comments
    const top = data?.filter(c => !c.parent_comment_id) || []
    const replies = data?.filter(c => c.parent_comment_id) || []
    const threaded = top.map(c => ({
      ...c,
      replies: replies.filter(r => r.parent_comment_id === c.id)
    }))
    setComments(threaded)
  }

  async function handleReaction() {
    if (!user) return

    if (hasUpvoted) {
      setUpvoteCount(c => Math.max(0, c - 1))
      setHasUpvoted(false)
      await supabase.from('reactions').delete().eq('project_id', id).eq('user_id', user.id)
    } else {
      setUpvoteCount(c => c + 1)
      setHasUpvoted(true)
      await supabase.from('reactions').upsert(
        { project_id: id, user_id: user.id, reaction_type: 'fire' },
        { onConflict: 'project_id,user_id' }
      )
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    setCommentLoading(true)

    try {
      // Moderate content
      try {
        const modRes = await fetch('/api/moderate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: commentText }),
        })
        const mod = await modRes.json()
        if (!mod.is_safe) {
          alert('Your comment was flagged: ' + (mod.reason || 'Please review.'))
          setCommentLoading(false)
          return
        }
      } catch (_) {}

      const { error } = await supabase.from('comments').insert({
        project_id: id,
        user_id: user.id,
        content: commentText.trim(),
        parent_comment_id: replyTo?.id || null,
      })

      if (error) throw error

      // Notify project owner
      if (project?.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: project.user_id,
          type: 'comment',
          content: {
            project_id: id,
            project_title: project.title,
            commenter_id: user.id,
            preview: commentText.slice(0, 100),
          },
          read: false,
        })
      }

      setCommentText('')
      setReplyTo(null)
      await fetchComments()
    } catch (err) {
      alert(err.message)
    } finally {
      setCommentLoading(false)
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id)
    await fetchComments()
  }

  if (loading) return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
    </div>
  )

  if (error || !project) return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">{error || 'Project not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    </div>
  )

  const author = project.users

  const isOwner = !!user && user.id === project.user_id

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mb-6 pl-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Project header */}
        <div className="card overflow-hidden mb-6">
          {project.image_url && (
            <img src={project.image_url} alt={project.title} className="w-full h-60 object-cover" />
          )}
          <div className="p-6">
            {/* Author */}
            <div className="flex items-center justify-between mb-4">
              <Link to={`/@${author?.username}`} className="flex items-center gap-3 group">
                {author?.profile_photo_url ? (
                  <img src={author.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold">
                    {author?.full_name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white group-hover:text-brand-300 transition-colors">{author?.full_name}</p>
                  <p className="text-sm text-gray-500">@{author?.username} · {formatDate(project.created_at)}</p>
                </div>
              </Link>
              <span className="badge bg-brand-900/50 text-brand-300 ">{project.project_type}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4 leading-tight">{project.title}</h1>

            {/* Impact */}
            {project.impact_metrics && (
              <div className="p-3 mb-4 bg-accent-500/10 border border-accent-500/20 rounded-lg text-accent-400 text-sm font-medium">
                📊 {project.impact_metrics}
              </div>
            )}

            {/* Description (markdown) */}
            <div className="prose-dark mb-5">
              <ReactMarkdown>{project.description}</ReactMarkdown>
            </div>

            {/* Tech stack */}
            {project.tech_stack?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {project.tech_stack.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            {/* Link */}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 rounded-lg text-sm font-medium text-zinc-200 transition-colors mb-5"
              >
                <ExternalLink size={15} />
                View project
              </a>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
              <button
                onClick={handleReaction}
                title="Upvote"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  hasUpvoted
                    ? 'bg-brand-700/40 text-brand-300 border border-brand-600/40 scale-105'
                    : 'bg-[#111111] text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200 border border-transparent'
                } ${!user ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <ThumbsUp size={16} />
                <span>{upvoteCount > 0 ? upvoteCount : 'Upvote'}</span>
              </button>
              <span className="flex items-center gap-1.5 text-sm text-zinc-500 ml-auto">
                <Eye size={14} />
                {viewCount} {viewCount === 1 ? 'view' : 'views'}
              </span>
            </div>
          </div>
        </div>

        {/* AI feedback — owner only, so we don't spend a call for every viewer */}
        {isOwner && <AIFeedbackPanel project={project} />}

        {/* Comments */}
        <div className="card p-6">
          <h2 className="font-bold text-white mb-1 flex items-center gap-2">
            <MessageSquare size={18} />
            {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} Comments
          </h2>
          <p className="text-xs text-gray-500 mb-5">Keep it technical, keep it real</p>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              {replyTo && (
                <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-[#111111] rounded-lg text-sm text-zinc-400">
                  <span>Replying to <strong className="text-gray-300">@{replyTo.users?.username}</strong></span>
                  <button type="button" onClick={() => setReplyTo(null)} className="hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  className="input resize-none flex-1"
                  rows={2}
                  placeholder={replyTo ? `Reply to ${replyTo.users?.full_name}...` : 'Add a comment...'}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(e)
                  }}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentLoading}
                  className="btn-primary self-end disabled:opacity-40"
                >
                  {commentLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                  ) : <Send size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Cmd/Ctrl+Enter to submit</p>
            </form>
          ) : (
            <div className="mb-6 p-3 bg-[#111111] rounded-lg text-sm text-zinc-400 text-center">
              <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link> to comment
            </div>
          )}

          {/* Comment list */}
          <div className="divide-y divide-gray-800/50">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={setReplyTo}
                  onDelete={handleDeleteComment}
                  currentUserId={user?.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
