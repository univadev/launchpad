import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  GRADE_12_COURSES, UNIVERSITIES, PROGRAMS, APPLICATION_STATUSES,
  MIN_COURSES, MAX_PROGRAMS, resolveProgram, customCourseCode,
} from '../lib/admissionsData'
import {
  Search, X, Plus, GripVertical, ArrowUp, ArrowDown, Check,
  AlertTriangle, GraduationCap, CheckCircle2, BookOpen, Building2, ListOrdered, Award,
} from 'lucide-react'

export const admissionsStorageKey = (userId) => `admissions:${userId || 'guest'}`

export function clearAdmissionsDraft(userId) {
  try { localStorage.removeItem(admissionsStorageKey(userId)) } catch { }
}

const emptyData = {
  courses: [],          
  universities: [],     
  programs: [],         
  extracurriculars: [],
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return { ...emptyData }
  return {
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    universities: Array.isArray(raw.universities) ? raw.universities : [],
    programs: Array.isArray(raw.programs) ? raw.programs : [],
    extracurriculars: Array.isArray(raw.extracurriculars) ? raw.extracurriculars : [],
  }
}

function loadDraft(userId) {
  try {
    const raw = localStorage.getItem(admissionsStorageKey(userId))
    if (!raw) return null
    return normalize(JSON.parse(raw))
  } catch {
    return null
  }
}

export function hasAdmissionsData(data) {
  const d = normalize(data)
  return d.courses.length > 0 || d.universities.length > 0 ||
    d.programs.length > 0 || d.extracurriculars.length > 0
}

// Every ranked program must have all of its required Grade 12 courses present.
function requirementsMetFor(data) {
  const codes = new Set((data.courses || []).map(c => c.code))
  return (data.programs || []).every(p => {
    const prog = resolveProgram(p)
    return !prog || prog.requirements.every(code => codes.has(code))
  })
}

const newUid = () => Math.random().toString(36).slice(2, 10)

function formatSaved(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return null
  }
}

export default function AdmissionsProfile({
  userId,
  embedded = false,
  hideHeader = false,
  onValidityChange,
  initialData = null,
  onDataChange,
}) {
 
  const persistToDb = !embedded
  const seed = useMemo(
    () => (embedded ? (loadDraft(userId) ?? { ...emptyData }) : normalize(initialData)),
    [], 
  )
  const [data, setData] = useState(seed)
  const [savedAt, setSavedAt] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const addedCodes = useMemo(() => new Set(data.courses.map(c => c.code)), [data.courses])
  const availablePrograms = useMemo(() => {
    const chosenIds = new Set(data.programs.map(p => p.programId))
    return PROGRAMS.filter(p => data.universities.includes(p.university) && !chosenIds.has(p.id))
  }, [data.universities, data.programs])
  const unmetPrograms = useMemo(() => data.programs.filter(p => {
    const prog = resolveProgram(p)
    return prog && prog.requirements.some(code => !addedCodes.has(code))
  }), [data.programs, addedCodes])
  const requirementsMet = unmetPrograms.length === 0
  const blocked = persistToDb && !requirementsMet

  useEffect(() => {
    onValidityChange?.(requirementsMet)
  }, [requirementsMet, onValidityChange])

  const onDataChangeRef = useRef(onDataChange)
  onDataChangeRef.current = onDataChange
  useEffect(() => {
    onDataChangeRef.current?.(data)
  }, [data])

  const isFirst = useRef(true)
  const dataRef = useRef(data)
  dataRef.current = data
  const dirtyRef = useRef(false)

  async function persist(next) {
    localStorage.setItem(admissionsStorageKey(userId), JSON.stringify(next))
    if (persistToDb) {
      if (!userId || !requirementsMetFor(next)) return
      setSaving(true)
      setSaveError('')
      const { error } = await supabase
        .from('users')
        .update({ admissions_profile: next })
        .eq('id', userId)
      setSaving(false)
      if (error) {
        console.error('admissions save error:', error)
        setSaveError(error.message || 'Failed to save')
        return
      }
    }
    dirtyRef.current = false
    setSavedAt(new Date().toISOString())
    setDirty(false)
  }

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    dirtyRef.current = true
    setDirty(true)
    const t = setTimeout(() => persist(data), 700)
    return () => clearTimeout(t)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (!dirtyRef.current) return
    const next = dataRef.current
    try { localStorage.setItem(admissionsStorageKey(userId), JSON.stringify(next)) } catch { /* ignore */ }
    if (persistToDb && userId && requirementsMetFor(next)) {
      supabase.from('users').update({ admissions_profile: next }).eq('id', userId)
        .then(({ error }) => { if (error) console.error('admissions flush save error:', error) })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      {!embedded && !hideHeader && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admissions profile</h2>
            <SaveStatus dirty={dirty} savedAt={savedAt} saving={saving} error={saveError} blocked={blocked} />
          </div>
        </div>
      )}

      <CoursesStep data={data} setData={setData} />
      <UniversitiesStep data={data} setData={setData} />
      <ProgramsStep data={data} setData={setData} availablePrograms={availablePrograms} />
      <ExtracurricularsStep data={data} setData={setData} />
      <RequirementCheckStep data={data} addedCodes={addedCodes} unmetCount={unmetPrograms.length} />

      <div className="flex items-center justify-end gap-4 flex-wrap pt-2 border-t border-white/10">
        <SaveStatus dirty={dirty} savedAt={savedAt} saving={saving} error={saveError} blocked={blocked} />
      </div>
    </div>
  )
}

function SaveStatus({ dirty, savedAt, saving, error, blocked }) {
  const saved = formatSaved(savedAt)
  return (
    <div className="flex items-center gap-2 text-xs mt-0.5">
      {error ? (
        <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {error}</span>
      ) : blocked ? (
        <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> Not saved — resolve the missing course requirements below</span>
      ) : saving ? (
        <span className="text-gray-400">Saving…</span>
      ) : dirty ? (
        <span className="text-yellow-400">Unsaved changes</span>
      ) : saved ? (
        <span className="text-green-400 flex items-center gap-1"><Check size={12} /> All changes saved</span>
      ) : (
        <span className="text-gray-500">No saved submission yet</span>
      )}
      {saved && !error && !blocked && <span className="text-gray-600">· Last saved: {saved}</span>}
    </div>
  )
}

function StepCard({ n, title, hint, count, children }) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white">
            <span className="text-brand-400">Step {n}</span> {title}
          </h3>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        {count != null && <span className="text-xs text-gray-400 shrink-0">{count}</span>}
      </div>
      {children}
    </section>
  )
}

function CoursesStep({ data, setData }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const chosen = new Set(data.courses.map(c => c.code))
    return GRADE_12_COURSES
      .filter(c => !chosen.has(c.code))
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, data.courses])

  function addCourse(course) {
    setData(d => ({ ...d, courses: [...d.courses, { uid: newUid(), code: course.code, name: course.name, grade: '' }] }))
    setQuery('')
  }

  // Courses outside Ontario (e.g. "AP Calculus BC") have no OSSD code, so derive
  // one — the list de-duplicates on `code` and the requirements check reads it.
  const trimmedQuery = query.trim()
  const canAddCustomCourse =
    trimmedQuery.length > 1 &&
    !data.courses.some(c => c.name.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !matches.some(c => c.name.toLowerCase() === trimmedQuery.toLowerCase())

  function addCustomCourse() {
    addCourse({ code: customCourseCode(trimmedQuery), name: trimmedQuery })
  }
  function setGrade(uid, grade) {
    const g = grade.replace(/[^\d]/g, '').slice(0, 3)
    setData(d => ({ ...d, courses: d.courses.map(c => c.uid === uid ? { ...c, grade: g } : c) }))
  }
  function removeCourse(uid) {
    setData(d => ({ ...d, courses: d.courses.filter(c => c.uid !== uid) }))
  }

  const count = data.courses.length
  return (
    <StepCard
      n={1}
      title="Add your Grade 12 courses"
      count={<span className={count >= MIN_COURSES ? 'text-green-400' : 'text-gray-400'}>Courses added: {count}/{MIN_COURSES}+</span>}
    >
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Search courses (e.g. English, Calculus, MCV4U...)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (matches.length > 0 || canAddCustomCourse) && (
          <div className="absolute z-20 mt-1 w-full bg-zinc-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden scrollbar-thin max-h-64 overflow-y-auto">
            {matches.map(c => (
              <button
                key={c.code}
                onClick={() => addCourse(c)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm text-gray-200">{c.name}</span>
                <span className="tag">{c.code}</span>
              </button>
            ))}
            {canAddCustomCourse && (
              <button
                onClick={addCustomCourse}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-800 transition-colors border-t border-gray-800"
              >
                <Plus size={14} className="text-brand-400 shrink-0" />
                <span className="text-sm text-gray-200 truncate">Add &ldquo;{trimmedQuery}&rdquo;</span>
                <span className="text-xs text-gray-500 ml-auto shrink-0">custom</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {data.courses.length === 0 && (
          <p className="text-xs text-gray-600 py-2">No courses yet search above to add at least {MIN_COURSES}.</p>
        )}
        {data.courses.map(c => (
          <div key={c.uid} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-100 truncate">{c.name}</p>
              <span className="tag mt-0.5">{c.code}</span>
            </div>
            <input
              className="w-16 px-2 py-1.5 bg-zinc-950 border border-gray-700 rounded-md text-gray-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Grade"
              inputMode="numeric"
              value={c.grade}
              onChange={e => setGrade(c.uid, e.target.value)}
              aria-label={`Grade for ${c.name}`}
            />
            <button onClick={() => removeCourse(c.uid)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-gray-800 transition-colors" aria-label="Remove course">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </StepCard>
  )
}

function UniversitiesStep({ data, setData }) {
  const [customInput, setCustomInput] = useState('')

  // Anything the user typed that isn't one of the built-in Ontario schools.
  // Rendered alongside them so a custom pick looks and behaves the same.
  const customUniversities = useMemo(
    () => data.universities.filter(u => !UNIVERSITIES.includes(u)),
    [data.universities]
  )
  const allUniversities = useMemo(
    () => [...UNIVERSITIES, ...customUniversities],
    [customUniversities]
  )

  function addCustom() {
    const name = customInput.trim()
    if (!name) return
    // Case-insensitive match so "waterloo" doesn't create a duplicate entry.
    const existing = allUniversities.find(u => u.toLowerCase() === name.toLowerCase())
    const finalName = existing || name
    setData(d => d.universities.includes(finalName)
      ? d
      : { ...d, universities: [...d.universities, finalName] })
    setCustomInput('')
  }

  function toggle(name) {
    setData(d => {
      const has = d.universities.includes(name)
      const universities = has ? d.universities.filter(u => u !== name) : [...d.universities, name]
      // Drop any ranked programs that belong to a now-deselected university.
      const programs = has
        ? d.programs.filter(p => { const prog = resolveProgram(p); return !prog || universities.includes(prog.university) })
        : d.programs
      return { ...d, universities, programs }
    })
  }
  return (
    <StepCard n={2} title="Choose universities" count={`Selected universities: ${data.universities.length}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {allUniversities.map(name => {
          const checked = data.universities.includes(name)
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${
                checked
                  ? 'bg-brand-600/15 border-brand-500/50 text-white'
                  : 'bg-zinc-900/60 border-white/5 text-gray-300 hover:border-gray-600'
              }`}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-brand-600 border-brand-500' : 'border-gray-600'}`}>
                {checked && <Check size={12} className="text-white" />}
              </span>
              {name}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          className="input flex-1"
          placeholder="Not listed? Add your university"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="btn-secondary text-sm disabled:opacity-40"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </StepCard>
  )
}

function ProgramsStep({ data, setData, availablePrograms }) {
  const [query, setQuery] = useState('')
  const [customUni, setCustomUni] = useState('')
  const dragIndex = useRef(null)

  // Default the custom-program university to the first selected one, and keep it
  // valid if the user later deselects that university.
  useEffect(() => {
    if (!data.universities.includes(customUni)) {
      setCustomUni(data.universities[0] || '')
    }
  }, [data.universities, customUni])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return availablePrograms
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.university.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, availablePrograms])

  const atMax = data.programs.length >= MAX_PROGRAMS

  function addProgram(prog) {
    if (atMax) return
    setData(d => ({ ...d, programs: [...d.programs, { uid: newUid(), programId: prog.id, status: 'Pending' }] }))
    setQuery('')
  }

  // A program not in the curated list is stored inline rather than by id, since
  // there is nothing to look it up in. resolveProgram() reads this shape.
  // requirements stays empty so the prerequisite check never blocks on a program
  // whose real requirements we don't know.
  function addCustomProgram() {
    if (atMax) return
    const name = query.trim()
    if (!name || !customUni) return
    setData(d => ({
      ...d,
      programs: [...d.programs, {
        uid: newUid(),
        custom: { name, university: customUni, requirements: [] },
        status: 'Pending',
      }],
    }))
    setQuery('')
  }
  function removeProgram(uid) {
    setData(d => ({ ...d, programs: d.programs.filter(p => p.uid !== uid) }))
  }
  function setStatus(uid, status) {
    setData(d => ({ ...d, programs: d.programs.map(p => p.uid === uid ? { ...p, status } : p) }))
  }
  function move(from, to) {
    if (to < 0 || to >= data.programs.length) return
    setData(d => {
      const arr = [...d.programs]
      const [m] = arr.splice(from, 1)
      arr.splice(to, 0, m)
      return { ...d, programs: arr }
    })
  }
  function onDrop(i) {
    const from = dragIndex.current
    dragIndex.current = null
    if (from == null || from === i) return
    move(from, i)
  }

  return (
    <StepCard
      n={3}
      title="Rank up to 20 programs"
      hint="Drag rows (or use the arrows) to set your ranking order."
      count={`${data.programs.length}/${MAX_PROGRAMS}`}
    >
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9 disabled:opacity-50"
          placeholder={data.universities.length === 0 ? 'Select universities first (Step 2)' : 'Search selected-university programs'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={data.universities.length === 0 || atMax}
        />
        {query && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-zinc-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden scrollbar-thin max-h-64 overflow-y-auto">
            {matches.map(p => (
              <button key={p.id} onClick={() => addProgram(p)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-800 transition-colors">
                <span className="text-sm text-gray-200">{p.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{p.university}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {query.trim() && matches.length === 0 && data.universities.length > 0 && !atMax && (
        <div className="flex flex-wrap items-center gap-2 mt-2 p-2.5 rounded-lg bg-zinc-900/60 border border-white/5">
          <span className="text-sm text-gray-300 truncate">
            Add &ldquo;{query.trim()}&rdquo; at
          </span>
          <select
            value={customUni}
            onChange={e => setCustomUni(e.target.value)}
            className="bg-zinc-950 border border-gray-700 rounded-md text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="University for custom program"
          >
            {data.universities.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="button" onClick={addCustomProgram} className="btn-secondary text-xs px-3 py-1.5 ml-auto">
            <Plus size={13} />
            Add
          </button>
        </div>
      )}
      {atMax && <p className="text-xs text-yellow-400 mt-2">You've reached the maximum of {MAX_PROGRAMS} programs.</p>}

      <div className="flex flex-col gap-2 mt-4">
        {data.programs.length === 0 && (
          <p className="text-xs text-gray-600 py-2">No programs ranked yet.</p>
        )}
        {data.programs.map((p, i) => {
          const prog = resolveProgram(p) || { name: 'Unknown program', university: '', requirements: [] }
          return (
            <div
              key={p.uid}
              draggable
              onDragStart={() => { dragIndex.current = i }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-white/5"
            >
              <GripVertical size={16} className="text-gray-600 cursor-grab shrink-0 hidden sm:block" />
              <span className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-100 truncate">{prog.name}</p>
                <p className="text-xs text-gray-500 truncate">{prog.university}</p>
              </div>
              <select
                value={p.status}
                onChange={e => setStatus(p.uid, e.target.value)}
                className="bg-zinc-950 border border-gray-700 rounded-md text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 shrink-0"
                aria-label="Application status"
              >
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex flex-col shrink-0">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
                <button onClick={() => move(i, i + 1)} disabled={i === data.programs.length - 1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
              </div>
              <button onClick={() => removeProgram(p.uid)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-gray-800 transition-colors shrink-0" aria-label="Remove program">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">Selected programs: {data.programs.length}/{MAX_PROGRAMS}</p>
    </StepCard>
  )
}

function ExtracurricularsStep({ data, setData }) {
  function add() {
    setData(d => ({ ...d, extracurriculars: [...d.extracurriculars, { uid: newUid(), type: '', description: '' }] }))
  }
  function update(uid, field, value) {
    setData(d => ({ ...d, extracurriculars: d.extracurriculars.map(e => e.uid === uid ? { ...e, [field]: value } : e) }))
  }
  function remove(uid) {
    setData(d => ({ ...d, extracurriculars: d.extracurriculars.filter(e => e.uid !== uid) }))
  }
  return (
    <StepCard n={4} title="Extracurriculars" hint="Optional volunteering, clubs, awards, sports, work.">
      <div className="flex flex-col gap-2">
        {data.extracurriculars.map(e => (
          <div key={e.uid} className="flex items-start gap-2">
            <input
              className="input sm:w-48 shrink-0"
              placeholder="Type (e.g. Volunteering)"
              value={e.type}
              onChange={ev => update(e.uid, 'type', ev.target.value)}
            />
            <input
              className="input flex-1"
              placeholder="Description"
              value={e.description}
              onChange={ev => update(e.uid, 'description', ev.target.value)}
            />
            <button onClick={() => remove(e.uid)} className="p-2.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-gray-800 transition-colors shrink-0" aria-label="Remove extracurricular">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn-ghost text-sm mt-3">
        <Plus size={16} /> Add extracurricular
      </button>
    </StepCard>
  )
}

function RequirementCheckStep({ data, addedCodes, unmetCount }) {
  return (
    <StepCard n={5} title="Requirement check" hint="Checks each ranked program's required Grade 12 courses against your list.">
      {unmetCount > 0 && (
        <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-amber-900/25 border border-amber-700/50 text-amber-300 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Add the missing course(s) below (or remove those programs) before you can launch your profile.
        </div>
      )}
      {data.programs.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">Rank at least one program (Step 3) to see requirement checks.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.programs.map(p => {
            const prog = resolveProgram(p)
            if (!prog) return null
            const missing = prog.requirements.filter(code => !addedCodes.has(code))
            const ok = missing.length === 0
            return (
              <div key={p.uid} className={`p-3 rounded-lg border ${ok ? 'bg-green-900/20 border-green-800/40' : 'bg-yellow-900/20 border-yellow-800/40'}`}>
                <p className="text-sm font-medium text-gray-100">{prog.university} {prog.name}</p>
                {ok ? (
                  <p className="text-xs text-green-400 flex items-center gap-1.5 mt-1"><CheckCircle2 size={13} /> All required courses are present.</p>
                ) : (
                  <p className="text-xs text-yellow-400 flex items-center gap-1.5 mt-1"><AlertTriangle size={13} /> Missing required course(s): {missing.join(', ')}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </StepCard>
  )
}

export function AdmissionsSummary({ data }) {
  const d = normalize(data)
  if (!hasAdmissionsData(d)) {
    return <p className="text-sm text-gray-500">No admissions profile added yet.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      {d.courses.length > 0 && (
        <div>
          <SummaryHeading icon={BookOpen} label="Grade 12 courses" count={d.courses.length} />
          <div className="flex flex-wrap gap-2">
            {d.courses.map(c => (
              <span key={c.uid || c.code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/5 text-sm text-gray-200">
                {c.name}
                <span className="tag">{c.code}</span>
                {c.grade !== '' && c.grade != null && (
                  <span className="text-xs font-semibold text-brand-300">{c.grade}%</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.universities.length > 0 && (
        <div>
          <SummaryHeading icon={Building2} label="Universities" count={d.universities.length} />
          <div className="flex flex-wrap gap-2">
            {d.universities.map(u => (
              <span key={u} className="px-2.5 py-1 rounded-lg bg-brand-600/15 border border-brand-500/30 text-sm text-brand-200">{u}</span>
            ))}
          </div>
        </div>
      )}

      {d.programs.length > 0 && (
        <div>
          <SummaryHeading icon={ListOrdered} label="Ranked programs" count={d.programs.length} />
          <div className="flex flex-col gap-2">
            {d.programs.map((p, i) => {
              const prog = resolveProgram(p)
              if (!prog) return null
              return (
                <div key={p.uid || p.programId} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-white/5">
                  <span className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-100 truncate">{prog.name}</p>
                    <p className="text-xs text-gray-500 truncate">{prog.university}</p>
                  </div>
                  {p.status && <span className="tag shrink-0">{p.status}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {d.extracurriculars.filter(e => e.type || e.description).length > 0 && (
        <div>
          <SummaryHeading icon={Award} label="Extracurriculars" count={d.extracurriculars.filter(e => e.type || e.description).length} />
          <div className="flex flex-col gap-2">
            {d.extracurriculars.filter(e => e.type || e.description).map(e => (
              <div key={e.uid} className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5">
                {e.type && <p className="text-sm font-medium text-gray-100">{e.type}</p>}
                {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryHeading({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={15} className="text-brand-400" />
      <h3 className="text-sm font-semibold text-white">{label}</h3>
      <span className="text-xs text-gray-500">{count}</span>
    </div>
  )
}
