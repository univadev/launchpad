import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Zap, Flame, Rocket, Lightbulb, Hand } from 'lucide-react'

const PROJECTS = [
  {
    user: 'Amara O.',
    field: 'AI/ML',
    title: 'Neural net that detects crop disease from phone photos',
    desc: 'Trained on 40k images of cassava leaves. 94% accuracy, deployed to 200 farmers in Ghana.',
    stack: ['Python', 'TensorFlow', 'React Native'],
    reactions: { fire: 47, rocket: 31, idea: 28 },
  },
  {
    user: 'Mikhail R.',
    field: 'Robotics',
    title: 'Autonomous wheelchair navigation system',
    desc: 'LIDAR + CV-based obstacle avoidance. Won regional engineering fair, patent pending.',
    stack: ['C++', 'ROS', 'Arduino'],
    reactions: { fire: 89, clap: 44, rocket: 60 },
  },
  {
    user: 'Priya N.',
    field: 'Biotech',
    title: 'CRISPR simulation tool for high school labs',
    desc: 'Web app that simulates gene editing experiments so schools without lab access can participate.',
    stack: ['React', 'Python', 'BioPython'],
    reactions: { idea: 72, clap: 55, fire: 38 },
  },
]

const STATS = [
  { label: 'Countries', value: '47+' },
  { label: 'Projects shared', value: '2.4k' },
  { label: 'Avg reactions/post', value: '12.8' },
  { label: 'Active builders', value: '840' },
]

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/feed" replace />

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-400">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-200 logo">
            <img src="/favicon.svg" alt="Univa Dev" className="w-8 h-8" />
            Univa Dev
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-1.5">Join now <ArrowRight size={14} /></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        {/* BG gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-700/50 rounded-full text-brand-300 text-xs font-semibold mb-6">
           
          Alpha Release
          </div>

          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight mb-6 leading-[1.05]">
            Your people
            <br />
            <span className="text-brand-400">are here.</span>
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
           Build in public. Get discovered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-base px-6 py-3">
              Start sharing your work <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-6 py-3">
              Already a builder? Sign in
            </Link>
          </div>

          {/* Stats 
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-semibold text-zinc-200 mb-1">{value}</div>
                <div className="text-sm text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
          */}
        </div>
      </section>

      {/* Project cards preview */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-3 text-zinc-200">What builders are making</h2>
            <p className="text-zinc-400">Real projects. Real impact. No fluff.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PROJECTS.map((p, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold">
                        {p.user[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-300">{p.user}</span>
                    </div>
                    <span className="badge mt-3 text-brand-300 border border-brand-800">{p.field}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-zinc-200 mb-2 leading-snug">{p.title}</h3>
                <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.stack.map(t => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  {p.reactions.fire && <span className="flex items-center gap-1"><Flame size={14} /> {p.reactions.fire}</span>}
                  {p.reactions.rocket && <span className="flex items-center gap-1"><Rocket size={14} /> {p.reactions.rocket}</span>}
                  {p.reactions.idea && <span className="flex items-center gap-1"><Lightbulb size={14} /> {p.reactions.idea}</span>}
                  {p.reactions.clap && <span className="flex items-center gap-1"><Hand size={14} /> {p.reactions.clap}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3 text-zinc-200">Built for serious builders</h2>
            <p className="text-zinc-400">Not a science fair. Not LinkedIn. Something new.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Show real work',
                desc: 'Markdown descriptions, tech stack tags, GitHub links, impact metrics. Your project deserves more than a screenshot.'
              },
              {
                title: 'Peer reactions that mean something',
                desc: 'Fire, bulb, clap, rocket — from people who understand what you actually built.'
              },
              {
                title: 'Build streaks',
                desc: 'Stay consistent. Track your posting streak and compete on the leaderboard.'
              },
              {
                title: 'Discover globally',
                desc: 'Filter by field, tech stack, country. Find the builders working on the same problems you are.'
              },
              {
                title: 'Portfolio in one click',
                desc: 'Share a print-ready PDF of your projects with a QR code. Perfect for applications.'
              },
              {
                title: 'AI project analysis',
                desc: 'Get smart suggestions on impact, skills demonstrated, and similar work — powered by Llama.'
              },
            ].map(({ title, desc }) => (
              <div key={title} className="card p-5">
                <h3 className="font-semibold text-zinc-200 mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/favicon.svg" alt="Univa Dev" className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-4xl font-semibold mb-4 text-zinc-200">Ready to share what you're building?</h2>
          <p className="text-zinc-400 text-lg mb-8">Join thousands of high school builders. No gatekeeping, no elitism. Just real projects.</p>
          <Link to="/signup" className="btn-primary text-base px-8 py-3">
            Create your builder profile <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-zinc-600">
       <p>
  © 2026 Univa Dev 
  <a href="https://univadev.com" class="text-brand-600 hover:text-brand-500 underline-offset-4 hover:underline transition-colors ml-4 mr-4">
    univadev.com
  </a> 
   Built for the builders
</p>
      </footer>
    </div>
  )
}
