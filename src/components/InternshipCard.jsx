import { MapPin, Clock, Wifi, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function InternshipCard({ internship, applied = false }) {
  return (
    <article className="card p-5 flex flex-col gap-4">
      {/* Company + role */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: internship.bgColor }}
          >
            {internship.company[0]}
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">{internship.company}</p>
            <h3 className="font-semibold text-zinc-200 text-sm leading-snug">{internship.role}</h3>
          </div>
        </div>
        {internship.featured && !applied && (
          <span className="badge bg-brand-900/50 text-brand-300 border border-brand-700/30 text-xs shrink-0">
            Featured
          </span>
        )}
        {applied && (
          <span className="badge bg-accent-600/20 text-accent-500 border border-accent-600/30 text-xs shrink-0 flex items-center gap-1">
            <CheckCircle size={11} />
            Applied
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 flex-1">
        {internship.description}
      </p>

      {/* Tags */}
      {internship.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {internship.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {internship.location}
        </span>
        {internship.remote && (
          <span className="flex items-center gap-1 text-accent-500">
            <Wifi size={11} />
            Remote OK
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {internship.duration}
        </span>
        {internship.stipend && (
          <span className="text-accent-500">{internship.stipend}</span>
        )}
      </div>

      {/* Action */}
      <div className="pt-3 border-t border-white/10">
        {applied ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-semibold bg-accent-600/10 text-accent-500 border border-accent-600/20 cursor-default"
          >
            <CheckCircle size={14} />
            Applied
          </button>
        ) : (
          <Link
            to={`/internships/${internship.id}/apply`}
            className="btn-primary w-full justify-center py-2 text-sm"
          >
            Apply Now
          </Link>
        )}
      </div>
    </article>
  )
}
