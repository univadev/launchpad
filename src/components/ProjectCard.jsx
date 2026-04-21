import { Link } from 'react-router-dom'
import { MessageSquare, ExternalLink, Clock, Flame, Lightbulb, Hand, Rocket } from 'lucide-react'
import { REACTIONS, timeAgo } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProjectCard({ project, onReactionToggle }) {
  const { user } = useAuth()

  const author = project.users || project.author
  const reactionCounts = project.reaction_counts || {}
  const userReaction = project.user_reaction || null
  const commentCount = project.comment_count || 0

  const reactionIcons = { fire: Flame, idea: Lightbulb, clap: Hand, rocket: Rocket }

  async function handleReaction(type) {
    if (!user) return
    onReactionToggle?.(project.id, type, userReaction)
  }

  return (
    <article className="card overflow-hidden">
      {/* Project image */}
      {project.image_url && (
        <div className="h-44 overflow-hidden">
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        {/* Author */}
        <div className="flex items-center justify-between mb-3">
          <Link to={`/@${author?.username}`} className="flex items-center gap-2.5 group">
            {author?.profile_photo_url ? (
              <img
                src={author.profile_photo_url}
                alt={author.full_name}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {author?.full_name?.[0] || '?'}
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                {author?.full_name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">@{author?.username}</span>
                {author?.country && <span className="text-xs">·</span>}
                {author?.country && <span className="text-xs text-zinc-500">{author.country}</span>}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="badge text-brand-300 border border-brand-800/50 text-xs">
              {project.project_type}
            </span>
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Clock size={11} />
              {timeAgo(project.created_at)}
            </div>
          </div>
        </div>

        {/* Title & description */}
        <Link to={`/post/${project.id}`}>
          <h2 className="font-semibold text-zinc-200 text-lg leading-snug hover:text-brand-300 transition-colors mb-2">
            {project.title}
          </h2>
        </Link>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3 line-clamp-3">
          {project.description}
        </p>

        {/* Impact metrics */}
        {project.impact_metrics && (
          <div className="text-xs text-brand-400 font-medium mb-3 bg-brand-500/10 rounded-lg px-3 py-2">
            {project.impact_metrics}
          </div>
        )}

        {/* Tech stack */}
        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tech_stack.slice(0, 6).map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
            {project.tech_stack.length > 6 && (
              <span className="tag text-zinc-600">+{project.tech_stack.length - 6}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1">
            {Object.entries(REACTIONS).map(([type, { label }]) => {
              const count = reactionCounts[type] || 0
              const isActive = userReaction === type
              const Icon = reactionIcons[type]
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  title={label}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-700/40 text-brand-300 border border-brand-600/40 scale-105'
                      : 'text-zinc-500 hover:bg-[#111111] hover:text-zinc-300'
                  } ${!user ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <Icon size={14} />
                  {count > 0 && <span>{count}</span>}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/post/${project.id}`}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <MessageSquare size={14} />
              {commentCount > 0 && <span>{commentCount}</span>}
              <span>Comments</span>
            </Link>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <ExternalLink size={13} />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
