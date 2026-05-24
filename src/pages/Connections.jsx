import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { normalizeUrl } from '../lib/utils'
import {
  Users, Search, X, Linkedin, Github, MessageCircle, MapPin, Flame, UserCheck, Clock, Inbox, AlertCircle
} from 'lucide-react'

const TABS = ['Connected', 'Pending']

export default function Connections() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Connected')
  const [connected, setConnected] = useState([])
  const [pendingIncoming, setPendingIncoming] = useState([])
  const [pendingOutgoing, setPendingOutgoing] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('connections')
      .select(`
        id, status, requester_id, recipient_id, created_at,
        requester:users!connections_requester_id_fkey (id, username, full_name, profile_photo_url, country, field_of_interest, current_streak, goal, linkedin_url, github_url, discord_username),
        recipient:users!connections_recipient_id_fkey (id, username, full_name, profile_photo_url, country, field_of_interest, current_streak, goal, linkedin_url, github_url, discord_username)
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) console.error('fetch connections error:', error)

    const accepted = []
    const incoming = []
    const outgoing = []

    ;(rows || []).forEach(r => {
      const other = r.requester_id === user.id ? r.recipient : r.requester
      if (!other) return
      const entry = { connectionId: r.id, ...other }
      if (r.status === 'accepted') accepted.push(entry)
      else if (r.status === 'pending') {
        if (r.recipient_id === user.id) incoming.push(entry)
        else outgoing.push(entry)
      }
    })

    setConnected(accepted)
    setPendingIncoming(incoming)
    setPendingOutgoing(outgoing)
    setLoading(false)
  }

  async function accept(connId) {
    setBusyId(connId)
    setActionError('')
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', connId)
    if (error) {
      console.error('accept connection error:', error)
      setActionError(error.message || 'Failed to accept request')
    }
    setBusyId(null)
    await fetchAll()
  }

  async function decline(connId) {
    setBusyId(connId)
    setActionError('')
    const { error } = await supabase.from('connections').delete().eq('id', connId)
    if (error) {
      console.error('decline connection error:', error)
      setActionError(error.message || 'Failed to decline request')
    }
    setBusyId(null)
    await fetchAll()
  }

  async function cancel(connId) {
    setBusyId(connId)
    setActionError('')
    const { error } = await supabase.from('connections').delete().eq('id', connId)
    if (error) {
      console.error('cancel connection error:', error)
      setActionError(error.message || 'Failed to cancel request')
    }
    setBusyId(null)
    await fetchAll()
  }

  // Strip leading @ so "@maya" matches username "maya"
  const q = search.trim().toLowerCase().replace(/^@/, '')
  const matches = (p) =>
    !q ||
    p.full_name?.toLowerCase().includes(q) ||
    p.username?.toLowerCase().includes(q)

  const filteredConnected = connected.filter(matches)
  const filteredIncoming = pendingIncoming.filter(matches)
  const filteredOutgoing = pendingOutgoing.filter(matches)

  const pendingCount = pendingIncoming.length + pendingOutgoing.length

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={22} className="text-brand-400" />
              Connections
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {connected.length} {connected.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or @username"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {actionError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 border border-gray-800 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                tab === t
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {t}
              {t === 'Pending' && pendingCount > 0 && (
                <span className="w-5 h-5 bg-brand-500/80 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
          </div>
        ) : tab === 'Connected' ? (
          filteredConnected.length === 0 ? (
            <EmptyState
              icon={Users}
              title={connected.length === 0 ? 'No connections yet' : 'No matches'}
              hint={connected.length === 0
                ? 'Find builders in Discover and click Connect on their profile.'
                : 'Try a different name or username.'}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredConnected.map(p => <ConnectionCard key={p.id} p={p} showSocials />)}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Inbox size={14} /> Incoming requests
                {pendingIncoming.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">({pendingIncoming.length})</span>
                )}
              </h2>
              {filteredIncoming.length === 0 ? (
                <p className="text-sm text-gray-600">No incoming requests.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredIncoming.map(p => (
                    <PendingRow
                      key={p.id}
                      p={p}
                      busy={busyId === p.connectionId}
                      actions={
                        <>
                          <button onClick={() => accept(p.connectionId)} disabled={busyId === p.connectionId} className="btn-primary text-xs py-1 px-2">
                            <UserCheck size={12} /> Accept
                          </button>
                          <button onClick={() => decline(p.connectionId)} disabled={busyId === p.connectionId} className="btn-ghost text-xs py-1 px-2">
                            <X size={12} /> Decline
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Clock size={14} /> Sent requests
                {pendingOutgoing.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">({pendingOutgoing.length})</span>
                )}
              </h2>
              {filteredOutgoing.length === 0 ? (
                <p className="text-sm text-gray-600">No outgoing requests.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredOutgoing.map(p => (
                    <PendingRow
                      key={p.id}
                      p={p}
                      busy={busyId === p.connectionId}
                      actions={
                        <button onClick={() => cancel(p.connectionId)} disabled={busyId === p.connectionId} className="btn-secondary text-xs py-1 px-2">
                          Cancel
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConnectionCard({ p, showSocials }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <Link to={`/@${p.username}`} className="flex items-center gap-3 group">
        {p.profile_photo_url ? (
          <img src={p.profile_photo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-700" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-brand-700 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {p.full_name?.[0] || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate">{p.full_name}</p>
          <p className="text-xs text-gray-500 truncate">@{p.username}</p>
        </div>
      </Link>

      {p.field_of_interest && (
        <span className="badge bg-brand-900/50 text-brand-300 text-xs self-start">{p.field_of_interest}</span>
      )}

      {p.goal && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{p.goal}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-zinc-600">
        {p.country && <span className="flex items-center gap-1"><MapPin size={12} /> {p.country}</span>}
        {p.current_streak > 0 && <span className="flex items-center gap-1"><Flame size={12} /> {p.current_streak}d</span>}
      </div>

      {showSocials && (p.linkedin_url || p.github_url || p.discord_username) && (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-800">
          {p.linkedin_url && (
            <a href={normalizeUrl(p.linkedin_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-brand-300 hover:text-brand-200 truncate">
              <Linkedin size={13} /> <span className="truncate">{p.linkedin_url.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {p.github_url && (
            <a href={normalizeUrl(p.github_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-brand-300 hover:text-brand-200 truncate">
              <Github size={13} /> <span className="truncate">{p.github_url.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {p.discord_username && (
            <span className="flex items-center gap-2 text-xs text-gray-300">
              <MessageCircle size={13} /> {p.discord_username}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function PendingRow({ p, actions }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <Link to={`/@${p.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
        {p.profile_photo_url ? (
          <img src={p.profile_photo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {p.full_name?.[0] || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors truncate">{p.full_name}</p>
          <p className="text-xs text-gray-500 truncate">@{p.username}</p>
        </div>
      </Link>
      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="card p-10 text-center">
      <Icon size={32} className="mx-auto mb-3 text-gray-600" />
      <p className="text-white font-semibold">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{hint}</p>
    </div>
  )
}
