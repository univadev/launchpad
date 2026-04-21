import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Home, Compass, Bell, Settings, LogOut, User, Zap, Menu, X
} from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchUnread()
    // Poll every 30s
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function fetchUnread() {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
  ]

  if (!user) return (
  <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-white/10">
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg text-zinc-200">
        <img src="/favicon.svg" alt="Univa Dev" className="w-8 h-8" />
        <span className="hidden md:block">Univa Dev</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">
          Log in
        </Link>
        <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">
          Sign up
        </Link>
      </div>
    </div>
  </nav>
)

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/feed" className="flex items-center gap-2 font-bold text-lg text-zinc-200">
          <img src="/favicon.svg" alt="Univa Dev" className="w-8 h-8" />
          <span className="hidden md:block">Launchpad</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111111]'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {profile?.current_streak > 0 && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1  border border-brand-500/30 rounded-full text-brand-400 text-xs font-semibold">
              <Zap size={12} />
              <span>{profile.current_streak}</span>
            </div>
          )}

          {/* Profile */}
          <Link
            to={`/@${profile?.username || user.id}`}
            className="flex items-center gap-2"
          >
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name}
                className="w-8 h-8 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold">
                {profile?.full_name?.[0] || profile?.username?.[0] || '?'}
              </div>
            )}
          </Link>

          {/* Settings */}
          <Link to="/settings" className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Settings size={18} />
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="hidden md:flex p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-80 bg-[#111111] border-l border-white/10 shadow-2xl z-40 transform transition-transform duration-300 ease-out md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex flex-col gap-1">
          {navLinks.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="ml-auto w-6 h-6 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          ))}
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
          >
            <Settings size={20} />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-[#1a1a1a] w-full text-left transition-colors"
          >
            <LogOut size={20} />
            Sign out
          </button>
          {profile?.current_streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 mt-4 text-brand-400 text-xs font-semibold border-t border-white/10 pt-4">
              <Zap size={14} />
              <span>{profile.current_streak} day streak</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
