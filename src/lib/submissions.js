// Submission tracker: data access and display helpers for venue_submissions
// (see db/migrations/008_venue_submissions.sql).

import { supabase } from './supabase'

export const SUBMISSION_STATUSES = ['planning', 'submitted', 'accepted', 'award', 'rejected']

export const STATUS_META = {
  planning: { label: 'Planning', style: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30' },
  submitted: { label: 'Submitted', style: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
  accepted: { label: 'Accepted', style: 'bg-accent-500/10 text-accent-500 border-accent-500/30' },
  award: { label: 'Award', style: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  rejected: { label: 'Not this time', style: 'bg-red-500/10 text-red-300 border-red-500/25' },
}

// Statuses that count as a result worth showing publicly.
export const WIN_STATUSES = ['accepted', 'award']

// Planning items due within this many days get flagged as "due soon".
export const DUE_SOON_DAYS = 7

// Whole days from today until a 'YYYY-MM-DD' deadline (negative when past).
// Parsed as a local date so a deadline doesn't shift a day in western timezones.
export function daysUntil(deadline) {
  if (!deadline) return null
  const [y, m, d] = deadline.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((due - today) / 86400000)
}

export function deadlineLabel(deadline) {
  const days = daysUntil(deadline)
  if (days === null) return 'No deadline set'
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

export function isDueSoon(sub) {
  if (sub.status !== 'planning') return false
  const days = daysUntil(sub.deadline)
  return days !== null && days <= DUE_SOON_DAYS
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Count of planning items that are overdue or due within DUE_SOON_DAYS.
export async function countDueSoon(userId) {
  const limit = new Date()
  limit.setDate(limit.getDate() + DUE_SOON_DAYS)
  const { count } = await supabase
    .from('venue_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'planning')
    .lte('deadline', toISODate(limit))
  return count || 0
}

export function trackVenue(userId, projectId, venueId) {
  return supabase
    .from('venue_submissions')
    .insert({ user_id: userId, project_id: projectId, venue_id: venueId })
    .select('*')
    .single()
}

export function updateSubmission(id, changes) {
  return supabase
    .from('venue_submissions')
    .update(changes)
    .eq('id', id)
    .select('*')
    .single()
}

export function deleteSubmission(id) {
  return supabase.from('venue_submissions').delete().eq('id', id)
}

// Lets the navbar badge refresh right after a change instead of on its next poll.
export function notifySubmissionsChanged() {
  window.dispatchEvent(new Event('submissions:changed'))
}
