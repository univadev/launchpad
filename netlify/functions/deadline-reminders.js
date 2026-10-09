// Daily email reminders for submission tracker deadlines.
//
// Scheduled in netlify.toml. Scheduled functions can't be called over HTTP in
// production; locally, run it with `netlify functions:invoke deadline-reminders`.
//
// Sends at most one email per student per run, listing every tracked venue in
// "planning" that is due in 7 days or less. Each row is reminded twice at most:
// once inside the 7-day window and once on the day before (see reminded_stage
// in db/migrations/009_deadline_reminders.sql).
//
// Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//      REMINDER_FROM_EMAIL (optional), URL (set by Netlify).

import { createClient } from '@supabase/supabase-js'
import { VENUE_BY_ID } from '../../src/lib/venues.js'

const WINDOW_DAYS = 7
const FROM = process.env.REMINDER_FROM_EMAIL || 'Launchpad <onboarding@resend.dev>'
const SITE_URL = (process.env.URL || 'http://localhost:8888').replace(/\/$/, '')

// Deadlines are plain dates; compare in UTC so the job's result doesn't depend
// on where the server runs. Can be up to a day off for the student's timezone,
// which is fine for a "heads up" email.
function todayUTC() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function daysBetween(from, deadline) {
  return Math.round((new Date(`${deadline}T00:00:00Z`) - from) / 86400000)
}

// 1 = final reminder (due today/tomorrow/overdue), 7 = first heads-up.
function stageFor(days) {
  return days <= 1 ? 1 : 7
}

// Already sent this stage (or a more urgent one) for this row.
function alreadyReminded(row, stage) {
  return row.reminded_stage != null && row.reminded_stage <= stage
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

function dueText(days) {
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  return `due in ${days} days`
}

function buildEmail(name, items) {
  const first = name ? name.split(' ')[0] : 'there'
  const soonest = items[0]
  const subject = items.length === 1
    ? `${soonest.venueName} is ${dueText(soonest.days)}`
    : `${items.length} submission deadlines coming up`

  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee">
        <strong>${escapeHtml(i.venueName)}</strong><br>
        <span style="color:#666;font-size:13px">for ${escapeHtml(i.projectTitle)}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:${i.days <= 1 ? '#c0392b' : '#333'}">
        ${escapeHtml(dueText(i.days))}<br>
        <span style="color:#999;font-size:12px">${escapeHtml(i.deadline)}</span>
      </td>
    </tr>`).join('')

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
      <p>Hi ${escapeHtml(first)},</p>
      <p>Heads up — these are coming up in your Launchpad submission tracker:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="margin:24px 0">
        <a href="${SITE_URL}/tracker" style="background:#6366f1;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Open your tracker</a>
      </p>
      <p style="color:#999;font-size:12px">
        Already submitted? Mark it in your tracker and we'll stop reminding you.<br>
        <a href="${SITE_URL}/settings" style="color:#999">Turn off deadline emails</a>
      </p>
    </div>`

  const text = [
    `Hi ${first},`,
    '',
    'Coming up in your Launchpad submission tracker:',
    ...items.map(i => `- ${i.venueName} (${i.projectTitle}): ${dueText(i.days)}, ${i.deadline}`),
    '',
    `Open your tracker: ${SITE_URL}/tracker`,
    `Turn off deadline emails: ${SITE_URL}/settings`,
  ].join('\n')

  return { subject, html, text }
}

async function sendEmail(to, { subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  })
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text().catch(() => '')}`)
  }
}

export const handler = async function () {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey || !process.env.RESEND_API_KEY) {
    console.error('deadline-reminders: missing VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY')
    return { statusCode: 500, body: 'Not configured' }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const today = todayUTC()
  const { data, error } = await supabase
    .from('venue_submissions')
    .select('id, user_id, venue_id, deadline, reminded_stage, projects(title), users(email, full_name, email_reminders)')
    .eq('status', 'planning')
    .not('deadline', 'is', null)
    .lte('deadline', isoDate(addDays(today, WINDOW_DAYS)))
    // Don't chase things that are long gone.
    .gte('deadline', isoDate(addDays(today, -1)))

  if (error) {
    console.error('deadline-reminders: query failed', error.message)
    return { statusCode: 500, body: 'Query failed' }
  }

  // Group the rows that need a reminder today by student.
  const byUser = new Map()
  for (const row of data || []) {
    const u = row.users
    if (!u?.email || u.email_reminders === false) continue
    const days = daysBetween(today, row.deadline)
    const stage = stageFor(days)
    if (alreadyReminded(row, stage)) continue

    if (!byUser.has(row.user_id)) byUser.set(row.user_id, { user: u, items: [] })
    byUser.get(row.user_id).items.push({
      id: row.id,
      stage,
      days,
      deadline: row.deadline,
      venueName: VENUE_BY_ID[row.venue_id]?.name || row.venue_id,
      projectTitle: row.projects?.title || 'your project',
    })
  }

  let sent = 0
  let failed = 0
  for (const { user, items } of byUser.values()) {
    items.sort((a, b) => a.days - b.days)
    try {
      await sendEmail(user.email, buildEmail(user.full_name, items))
      sent++
    } catch (err) {
      // Leave reminded_stage alone so tomorrow's run retries this student.
      console.error('deadline-reminders: send failed', err.message)
      failed++
      continue
    }

    for (const stage of [1, 7]) {
      const ids = items.filter(i => i.stage === stage).map(i => i.id)
      if (!ids.length) continue
      const { error: updErr } = await supabase
        .from('venue_submissions')
        .update({ reminded_stage: stage })
        .in('id', ids)
      if (updErr) console.error('deadline-reminders: could not mark reminded', updErr.message)
    }
  }

  console.log(`deadline-reminders: ${sent} sent, ${failed} failed, ${byUser.size} students due`)
  return { statusCode: 200, body: JSON.stringify({ sent, failed }) }
}
