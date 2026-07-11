import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ProjectCard'
import AdmissionsProfile, { AdmissionsSummary, hasAdmissionsData } from '../components/AdmissionsProfile'
import { formatDate, timeAgo, normalizeUrl } from '../lib/utils'
import {
  MapPin, GraduationCap, Calendar, Zap, Share2, Printer,
  ExternalLink, Flame, BarChart3, Trophy, QrCode, Download,
  UserPlus, UserCheck, Clock, X, Linkedin, Github, MessageCircle, Users,
  Pencil, Check as CheckIcon
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

// QR Code via API (no external lib needed)
function QRCodeImg({ url }) {
  const encoded = encodeURIComponent(url)
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encoded}&bgcolor=1f2937&color=a5b4fc`}
      alt="QR Code"
      className="w-24 h-24"
    />
  )
}

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const printRef = useRef()

  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [totalReactions, setTotalReactions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  // { status: 'none'|'pending_outgoing'|'pending_incoming'|'accepted', id?: string }
  const [connection, setConnection] = useState({ status: 'none' })
  const [connBusy, setConnBusy] = useState(false)
  const [connError, setConnError] = useState('')
  const [editingAdmissions, setEditingAdmissions] = useState(false)

  const cleanUsername = username?.replace(/^@/, '')

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${profile?.full_name} — Univa Dev Portfolio`,
  })

  useEffect(() => {
    fetchProfile()
  }, [cleanUsername])

  async function fetchProfile() {
    setLoading(true)
    setEditingAdmissions(false)

    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanUsername)
      .single()

    if (error || !profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })

    const enriched = await Promise.all((projectsData || []).map(async p => {
      const [reactionRes, userReactionRes, commentRes, viewRes] = await Promise.all([
        supabase.from('reactions').select('reaction_type').eq('project_id', p.id),
        user ? supabase.from('reactions').select('reaction_type').eq('project_id', p.id).eq('user_id', user?.id).single() : Promise.resolve({ data: null }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
        supabase.from('project_views').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
      ])
      const counts = { fire: 0, idea: 0, clap: 0, rocket: 0 }
      reactionRes.data?.forEach(r => { if (counts[r.reaction_type] !== undefined) counts[r.reaction_type]++ })
      return {
        ...p,
        users: profileData,
        reaction_counts: counts,
        user_reaction: userReactionRes.data?.reaction_type || null,
        comment_count: commentRes.count || 0,
        view_count: viewRes.count || 0,
      }
    }))

    setProjects(enriched)

    // Total reactions
    const total = enriched.reduce((sum, p) => {
      return sum + Object.values(p.reaction_counts).reduce((a, b) => a + b, 0)
    }, 0)
    setTotalReactions(total)

    // Connection count (accepted, either direction) — public
    const { count: connCount } = await supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profileData.id},recipient_id.eq.${profileData.id}`)
    setConnectionCount(connCount || 0)

    // Viewer's relationship with this profile
    if (user && user.id !== profileData.id) {
      const { data: connRow } = await supabase
        .from('connections')
        .select('id, requester_id, recipient_id, status')
        .or(
          `and(requester_id.eq.${user.id},recipient_id.eq.${profileData.id}),` +
          `and(requester_id.eq.${profileData.id},recipient_id.eq.${user.id})`
        )
        .maybeSingle()

      if (connRow) {
        if (connRow.status === 'accepted') {
          setConnection({ status: 'accepted', id: connRow.id })
        } else if (connRow.status === 'pending') {
          setConnection({
            status: connRow.requester_id === user.id ? 'pending_outgoing' : 'pending_incoming',
            id: connRow.id,
          })
        } else {
          setConnection({ status: 'none' })
        }
      } else {
        setConnection({ status: 'none' })
      }
    }

    setLoading(false)
  }

  async function sendConnectionRequest() {
    if (!user || !profile) return
    setConnBusy(true)
    setConnError('')
    const { data, error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, recipient_id: profile.id, status: 'pending' })
      .select('id')
      .single()
    if (error) {
      console.error('connect insert error:', error)
      setConnError(error.message || 'Failed to send request')
    } else if (data) {
      setConnection({ status: 'pending_outgoing', id: data.id })
    }
    setConnBusy(false)
  }

  async function cancelConnectionRequest() {
    if (!connection.id) return
    setConnBusy(true)
    setConnError('')
    const { error } = await supabase.from('connections').delete().eq('id', connection.id)
    if (error) {
      console.error('connect cancel error:', error)
      setConnError(error.message || 'Failed to cancel')
    } else {
      setConnection({ status: 'none' })
    }
    setConnBusy(false)
  }

  async function respondToRequest(accept) {
    if (!connection.id) return
    setConnBusy(true)
    setConnError('')
    if (accept) {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', connection.id)
      if (error) {
        console.error('connect accept error:', error)
        setConnError(error.message || 'Failed to accept')
      } else {
        setConnection({ status: 'accepted', id: connection.id })
        setConnectionCount(c => c + 1)
      }
    } else {
      const { error } = await supabase.from('connections').delete().eq('id', connection.id)
      if (error) {
        console.error('connect decline error:', error)
        setConnError(error.message || 'Failed to decline')
      } else {
        setConnection({ status: 'none' })
      }
    }
    setConnBusy(false)
  }

  if (loading) return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
    </div>
  )

  if (notFound) return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold mb-2">Profile not found</p>
        <p className="text-gray-400 mb-4">@{cleanUsername} doesn't exist (yet).</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    </div>
  )

  const isOwn = user?.id === profile.id
  const profileUrl = `https://univadev.com/@${profile.username}`

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-700 flex items-center justify-center text-white text-3xl font-black">
                  {profile.full_name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                  <p className="text-gray-400">@{profile.username}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isOwn ? (
                    <Link to="/settings" className="btn-secondary text-sm py-1.5">Edit profile</Link>
                  ) : user ? (
                    <>
                      {connection.status === 'none' && (
                        <button onClick={sendConnectionRequest} disabled={connBusy} className="btn-primary text-sm py-1.5">
                          <UserPlus size={15} />
                          Connect
                        </button>
                      )}
                      {connection.status === 'pending_outgoing' && (
                        <button onClick={cancelConnectionRequest} disabled={connBusy} className="btn-secondary text-sm py-1.5">
                          <Clock size={15} />
                          Pending — cancel
                        </button>
                      )}
                      {connection.status === 'pending_incoming' && (
                        <>
                          <button onClick={() => respondToRequest(true)} disabled={connBusy} className="btn-primary text-sm py-1.5">
                            <UserCheck size={15} />
                            Accept
                          </button>
                          <button onClick={() => respondToRequest(false)} disabled={connBusy} className="btn-ghost text-sm py-1.5">
                            <X size={15} />
                            Decline
                          </button>
                        </>
                      )}
                      {connection.status === 'accepted' && (
                        <span className="btn-secondary text-sm py-1.5 cursor-default" title="You're connected">
                          <UserCheck size={15} />
                          Connected
                        </span>
                      )}
                      {connError && (
                        <span className="text-xs text-red-400 basis-full">{connError}</span>
                      )}
                    </>
                  ) : null}
                  <button
                    onClick={handlePrint}
                    className="btn-ghost text-sm py-1.5"
                    title="Export portfolio as PDF"
                  >
                    <Share2 size={15} />
                    Portfolio PDF
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                {profile.school && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} />
                    {profile.school}
                  </span>
                )}
                {profile.graduation_year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Class of {profile.graduation_year}
                  </span>
                )}
                {profile.country && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.country}
                  </span>
                )}
                {profile.field_of_interest && (
                  <span className="badge  text-brand-300 border border-brand-800/50">
                    {profile.field_of_interest}
                  </span>
                )}
              </div>

              {/* Goal */}
              {profile.goal && (
                <div className="p-3 bg-brand-900/20   rounded-lg mb-3">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-1">Working toward</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{profile.goal}</p>
                </div>
              )}

              {/* Interests */}
              {profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map(i => (
                    <span key={i} className="tag text-xs">{i}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-800">
            {[
              { label: 'Projects', value: projects.length, icon: BarChart3 },
              { label: 'Reactions', value: totalReactions, icon: Trophy },
              { label: 'Connections', value: connectionCount, icon: Users },
              { label: 'Day streak', value: profile.current_streak || 0, icon: Flame },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center p-3 bg-gray-800/20 rounded-xl">
                <Icon size={16} className="mx-auto mb-1 text-gray-500" />
                <p className="text-xl font-bold text-white">{typeof value === 'number' ? value : value.split('\n')[0]}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Socials — visible to self, or to connected viewers */}
        {(isOwn || connection.status === 'accepted') && (profile.linkedin_url || profile.github_url || profile.discord_username) && (
          <div className="card p-5 mb-6">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Users size={16} />
              Socials
              {!isOwn && <span className="text-xs font-normal text-gray-500">— visible because you're connected</span>}
            </h2>
            <div className="flex flex-col gap-2">
              {profile.linkedin_url && (
                <a href={normalizeUrl(profile.linkedin_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200">
                  <Linkedin size={15} /> {profile.linkedin_url}
                </a>
              )}
              {profile.github_url && (
                <a href={normalizeUrl(profile.github_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200">
                  <Github size={15} /> {profile.github_url}
                </a>
              )}
              {profile.discord_username && (
                <span className="flex items-center gap-2 text-sm text-gray-300">
                  <MessageCircle size={15} /> {profile.discord_username}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Owner can edit inline; anyone else sees it only when it has content. */}
        {(isOwn || hasAdmissionsData(profile.admissions_profile)) && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <GraduationCap size={16} />
                Admissions profile
              </h2>
              {isOwn && (
                <button
                  onClick={() => setEditingAdmissions(e => !e)}
                  className="btn-secondary text-sm py-1.5"
                >
                  {editingAdmissions ? (
                    <><CheckIcon size={15} /> Done</>
                  ) : (
                    <><Pencil size={15} /> {hasAdmissionsData(profile.admissions_profile) ? 'Edit' : 'Add'}</>
                  )}
                </button>
              )}
            </div>

            {isOwn && editingAdmissions ? (
              <AdmissionsProfile
                userId={profile.id}
                hideHeader
                initialData={profile.admissions_profile}
                onDataChange={(d) => setProfile(p => ({ ...p, admissions_profile: d }))}
              />
            ) : (
              <AdmissionsSummary data={profile.admissions_profile} />
            )}
          </div>
        )}

        {/* Projects */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Projects <span className="text-gray-600 font-normal text-sm">({projects.length})</span>
          </h2>

          {projects.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400">No projects posted yet.</p>
              {isOwn && (
                <Link to="/feed" className="btn-primary mt-4 inline-flex">
                  Post your first project
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden print view */}
      <div ref={printRef} className="hidden print:block p-8 bg-white text-black">
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
            <p className="text-gray-500">@{profile.username} · univadev.com</p>
            {profile.school && <p className="text-sm text-gray-600 mt-1">{profile.school} · Class of {profile.graduation_year}</p>}
            {profile.country && <p className="text-sm text-gray-600">{profile.country}</p>}
          </div>
          <div className="text-center">
            <QRCodeImg url={profileUrl} />
            <p className="text-xs text-gray-400 mt-1">univadev.com/@{profile.username}</p>
          </div>
        </div>

        {profile.goal && (
          <div className="mb-6 p-3 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">WORKING TOWARD</p>
            <p className="text-sm text-gray-700">{profile.goal}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Total reactions', value: totalReactions },
            { label: 'Best streak', value: `${profile.current_streak || 0} days` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3">Projects</h2>
        {projects.map(p => (
          <div key={p.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900">{p.title}</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{p.project_type}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{p.description}</p>
            {p.impact_metrics && <p className="text-xs font-medium text-orange-600 mb-2">📊 {p.impact_metrics}</p>}
            <div className="flex flex-wrap gap-1">
              {p.tech_stack?.map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{t}</span>
              ))}
            </div>
            {p.link && <p className="text-xs text-blue-600 mt-1">{p.link}</p>}
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          Generated from Univa Dev · univadev.com · {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
