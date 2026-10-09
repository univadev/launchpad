import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

// "Looking for teammates" box on a project page. Visitors pick a role and send
// a short note; the owner gets a notification linking to their profile
// (express_collab_interest, db/migrations/013).
export default function TeammatesPanel({ project, user, isOwner }) {
  const roles = project.looking_for || []
  const [role, setRole] = useState(roles[0] || '')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!roles.length) return null

  async function send(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('express_collab_interest', {
      p_project_id: project.id,
      p_role: role,
      p_message: message.trim() || null,
    })
    setSending(false)
    if (err && !/already told them/i.test(err.message)) {
      setError(err.message || 'Could not send. Try again.')
      return
    }
    setSent(true)
  }

  return (
    <div id="teammates" className="card p-6 mb-6 scroll-mt-20">
      <h2 className="font-bold text-white flex items-center gap-2 mb-1">
        <Handshake size={18} className="text-accent-500" />
        Looking for teammates
      </h2>
      <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
        {roles.map(r => <span key={r} className="tag">{r}</span>)}
      </div>

      {isOwner ? (
        <p className="text-sm text-zinc-500">
          Students who are interested will show up in your notifications. Edit the project to change roles.
        </p>
      ) : !user ? (
        <p className="text-sm text-zinc-400">
          <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link> to raise your hand.
        </p>
      ) : sent ? (
        <p className="text-sm text-accent-500 flex items-center gap-1.5">
          <Check size={15} /> Sent. They'll see your profile and can connect with you.
        </p>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="btn-primary text-sm">
          <Handshake size={15} /> I'm interested
        </button>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3">
          <label className="text-sm text-zinc-300">
            As a
            <select value={role} onChange={e => setRole(e.target.value)} className="input mt-1.5">
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            maxLength={300}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Optional: a line about what you'd bring (300 characters max)"
          />
          {error && (
            <p className="text-xs text-red-300 flex items-center gap-1.5">
              <AlertCircle size={13} /> {error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={sending || !role} className="btn-primary text-sm">
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
