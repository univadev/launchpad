import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'
import { Bell, CheckCheck, MessageSquare, Zap, Star, UserPlus, UserCheck, X } from 'lucide-react'

const NOTIF_ICONS = {
  reaction: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  comment: { icon: MessageSquare, color: 'text-brand-400', bg: 'bg-brand-900/20' },
  mention: { icon: Zap, color: 'text-accent-400', bg: 'bg-accent-900/20' },
  connection_request: { icon: UserPlus, color: 'text-brand-400', bg: 'bg-brand-900/20' },
  connection_accepted: { icon: UserCheck, color: 'text-green-400', bg: 'bg-green-900/20' },
}

function NotifItem({ notif, onRead, onRespond, respondingId }) {
  const { icon: Icon, color, bg } = NOTIF_ICONS[notif.type] || NOTIF_ICONS.reaction
  const content = notif.content || {}

  function getDescription() {
    if (notif.type === 'reaction') {
      return `Someone reacted to "${content.project_title || 'your project'}"`
    }
    if (notif.type === 'comment') {
      return `New comment on "${content.project_title || 'your project'}": ${content.preview || ''}`
    }
    if (notif.type === 'mention') {
      return `You were mentioned in a comment`
    }
    if (notif.type === 'connection_request') {
      const name = content.requester_name || content.requester_username || 'Someone'
      return `${name} wants to connect with you`
    }
    if (notif.type === 'connection_accepted') {
      return `Your connection request was accepted`
    }
    return 'New notification'
  }

  const link = content.project_id
    ? `/post/${content.project_id}`
    : content.requester_username
      ? `/${content.requester_username}`
      : '#'

  const isPendingRequest = notif.type === 'connection_request' && content.connection_id && !content.resolved
  const responding = respondingId === notif.id

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
        notif.read
          ? 'border-gray-800 bg-gray-900/30'
          : 'border-brand-800/40 bg-brand-900/10'
      }`}
      onClick={() => onRead(notif.id)}
    >
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-gray-200'} leading-relaxed`}>
          {getDescription()}
        </p>
        <p className="text-xs text-gray-600 mt-1">{timeAgo(notif.created_at)}</p>
      </div>
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
      )}
      {isPendingRequest ? (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onRespond(notif, true)}
            disabled={responding}
            className="btn-primary text-xs py-1 px-2"
          >
            <UserCheck size={12} />
            Accept
          </button>
          <button
            onClick={() => onRespond(notif, false)}
            disabled={responding}
            className="btn-ghost text-xs py-1 px-2"
          >
            <X size={12} />
            Decline
          </button>
        </div>
      ) : link !== '#' && (
        <Link
          to={link}
          onClick={e => e.stopPropagation()}
          className="text-xs text-brand-400 hover:text-brand-300 shrink-0"
        >
          View →
        </Link>
      )}
    </div>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState(null)

  useEffect(() => {
    fetchNotifications()
  }, [user])

  async function fetchNotifications() {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setLoading(false)

    // Auto-clear the unread badge as soon as the user opens this page.
    // We keep the in-memory `read: false` so "New" still highlights
    // what was unread at the moment of opening.
    const unreadIds = (data || []).filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
      window.dispatchEvent(new Event('notifications:read'))
    }
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    window.dispatchEvent(new Event('notifications:read'))
  }

  async function respondToConnection(notif, accept) {
    const connId = notif.content?.connection_id
    if (!connId) return
    setRespondingId(notif.id)
    if (accept) {
      await supabase
        .from('connections')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', connId)
    } else {
      await supabase.from('connections').delete().eq('id', connId)
    }
    const newContent = { ...(notif.content || {}), resolved: true, accepted: accept }
    await supabase
      .from('notifications')
      .update({ read: true, content: newContent })
      .eq('id', notif.id)
    setNotifications(prev => prev.map(n =>
      n.id === notif.id ? { ...n, read: true, content: newContent } : n
    ))
    setRespondingId(null)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    window.dispatchEvent(new Event('notifications:read'))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell size={20} />
              Notifications
              {unreadCount > 0 && (
                <span className="w-6 h-6 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400">Reactions, comments, and mentions</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-ghost text-sm"
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="mx-auto text-gray-700 mb-4" />
            <h2 className="text-lg font-semibold text-gray-500 mb-1">All quiet here</h2>
            <p className="text-sm text-gray-600">When someone reacts to your project or comments, you'll see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Unread first */}
            {notifications.filter(n => !n.read).length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">New</p>
                {notifications.filter(n => !n.read).map(n => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} onRespond={respondToConnection} respondingId={respondingId} />
                ))}
              </>
            )}

            {notifications.filter(n => n.read).length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1 mt-2">Earlier</p>
                {notifications.filter(n => n.read).map(n => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} onRespond={respondToConnection} respondingId={respondingId} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
