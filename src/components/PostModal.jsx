import { useState, useRef } from 'react'
import { X, Plus, Sparkles, Upload, Image, ChevronDown, ChevronUp, AlertCircle, Check, Lightbulb, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PROJECT_TYPES, TECH_SUGGESTIONS, calculateStreak } from '../lib/utils'
import { candidatesFor } from '../lib/venues'

const MAX_IMAGE_SIZE = 800 // px
const IMAGE_QUALITY = 0.82

async function compressImage(file) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height, 1)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', IMAGE_QUALITY)
    }
    img.src = url
  })
}

export default function PostModal({ onClose, onSuccess }) {
  const { user, profile, refreshProfile } = useAuth()
  const fileRef = useRef()

  const [form, setForm] = useState({
    title: '',
    description: '',
    project_type: '',
    tech_stack: [],
    link: '',
    impact_metrics: '',
    collaborator_ids: [],
  })

  const [techInput, setTechInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const techSuggestions = TECH_SUGGESTIONS.filter(t =>
    t.toLowerCase().includes(techInput.toLowerCase()) &&
    !form.tech_stack.includes(t)
  ).slice(0, 6)

  function addTech(t) {
    const tech = t.trim()
    if (tech && !form.tech_stack.includes(tech) && form.tech_stack.length < 12) {
      setForm(f => ({ ...f, tech_stack: [...f.tech_stack, tech] }))
    }
    setTechInput('')
  }

  function removeTech(t) {
    setForm(f => ({ ...f, tech_stack: f.tech_stack.filter(x => x !== t) }))
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compressImage(file)
    setImageFile(blob)
    setImagePreview(URL.createObjectURL(blob))
  }

  async function runAIAnalysis() {
    if (!form.title || !form.description) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tech_stack: form.tech_stack,
          project_type: form.project_type,
          impact_metrics: form.impact_metrics,
          link: form.link,
          candidates: candidatesFor(form.project_type).map(v => ({
            id: v.id, name: v.name, kind: v.kind, selectivity: v.selectivity, blurb: v.blurb,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!data) throw new Error('Could not reach the feedback service — try `netlify dev`.')
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAiSuggestions(data)
    } catch (err) {
      setAiSuggestions({ error: err.message || 'AI analysis unavailable — submit anyway!' })
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.description || !form.project_type) {
      setError('Please fill in title, description, and project type.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Content moderation
      try {
        const modRes = await fetch('/api/moderate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `${form.title} ${form.description}` }),
        })
        const modData = await modRes.json()
        if (!modData.is_safe) {
          setError('Your post was flagged: ' + (modData.reason || 'Please review your content.'))
          setLoading(false)
          return
        }
      } catch (_) {
        // If moderation fails, proceed normally
      }

      // Upload image
      let imageUrl = null
      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('project-images')
          .upload(fileName, imageFile, { contentType: 'image/jpeg', upsert: false })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Insert project
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          project_type: form.project_type,
          tech_stack: form.tech_stack,
          link: form.link.trim() || null,
          image_url: imageUrl,
          impact_metrics: form.impact_metrics.trim() || null,
          collaborator_ids: form.collaborator_ids,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Update streak
      const { newStreak } = calculateStreak(profile?.last_post_date, profile?.current_streak)
      await supabase
        .from('users')
        .update({
          current_streak: newStreak,
          last_post_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', user.id)

      await refreshProfile()
      onSuccess?.(project)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl my-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Share a project</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2.5 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project title *</label>
            <input
              type="text"
              className="input"
              placeholder="What did you build?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={120}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description * <span className="text-gray-600 font-normal">(supports markdown)</span></label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Describe what you built, the problem it solves, how it works, what you learned..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Project type + Image upload */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project type *</label>
              <select
                className="input"
                value={form.project_type}
                onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}
              >
                <option value="">Select type...</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Image <span className="text-gray-600 font-normal">(optional)</span></label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-20 w-full object-cover rounded-lg border border-gray-700" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-1 right-1 bg-gray-900/80 hover:bg-gray-900 text-white rounded-md p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Image size={18} />
                  <span className="text-sm">Add screenshot</span>
                </button>
              )}
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tech stack</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tech_stack.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-900/60 border border-brand-700/50 text-brand-300 text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => removeTech(t)} className="hover:text-white ml-0.5">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                className="input pr-20"
                placeholder="Type a tech, press Enter..."
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addTech(techInput) }
                  if (e.key === ',') { e.preventDefault(); addTech(techInput) }
                }}
              />
              <button
                type="button"
                onClick={() => addTech(techInput)}
                disabled={!techInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-secondary text-xs px-2 py-1 disabled:opacity-30"
              >
                Add
              </button>
            </div>
            {techInput && techSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {techSuggestions.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTech(t)}
                    className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 text-xs hover:border-brand-600 hover:text-brand-300 transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project link <span className="text-gray-600 font-normal">(optional)</span></label>
              <input
                type="url"
                className="input"
                placeholder="https://github.com/..."
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Impact metrics <span className="text-gray-600 font-normal">(optional)</span></label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 500 users, 94% accuracy"
                value={form.impact_metrics}
                onChange={e => setForm(f => ({ ...f, impact_metrics: e.target.value }))}
              />
            </div>
          </div>

          {/* AI Analysis */}
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setShowAI(!showAI)
                if (!showAI && !aiSuggestions) runAIAnalysis()
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors text-sm font-medium text-gray-300"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-brand-400" />
                AI Project Analysis
                <span className="text-xs text-gray-500">(optional, doesn't block submission)</span>
              </div>
              {showAI ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAI && (
              <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-fast" />
                    Analyzing your project...
                  </div>
                ) : aiSuggestions ? (
                  <div className="space-y-3 text-sm">
                    {aiSuggestions.error ? (
                      <p className="text-gray-500">{aiSuggestions.error}</p>
                    ) : (
                      <>
                        {aiSuggestions.verdict && (
                          <p className="text-gray-200 leading-relaxed">{aiSuggestions.verdict}</p>
                        )}
                        {aiSuggestions.readiness_label && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 flex-1 max-w-[140px]">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= aiSuggestions.readiness ? 'bg-brand-500' : 'bg-white/10'}`} />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-gray-400">{aiSuggestions.readiness_label}</span>
                          </div>
                        )}
                        {aiSuggestions.gaps?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Lightbulb size={12} /> Fix before you post</p>
                            <div className="space-y-2">
                              {aiSuggestions.gaps.map((g, i) => (
                                <div key={i}>
                                  <p className="text-gray-200">{g.issue}</p>
                                  <p className="text-gray-400 leading-relaxed">&rarr; {g.fix}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {aiSuggestions.skills_demonstrated?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Target size={12} /> Skills Demonstrated</p>
                            <div className="flex flex-wrap gap-1.5">
                              {aiSuggestions.skills_demonstrated.map((sk, i) => <span key={i} className="tag">{sk}</span>)}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-600">Post it to see where you could submit this project.</p>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={runAIAnalysis}
                      className="text-xs text-brand-400 hover:text-brand-300 underline"
                    >
                      Re-analyze
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runAIAnalysis}
                    disabled={!form.title || !form.description}
                    className="btn-secondary text-sm disabled:opacity-40"
                  >
                    <Sparkles size={14} />
                    Analyze my project
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check size={16} />
                  Publish project
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
