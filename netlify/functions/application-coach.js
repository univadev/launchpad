import { requireUser } from '../lib/requireUser.js'

// Application coach: helps a student answer a university application question
// (e.g. a supplementary form or profile) using only their real record on
// Launchpad — projects, results and activities.
//
// Deliberately does NOT write the answer. Universities expect these to be the
// student's own words, so it either plans talking points ("plan") or critiques
// a draft the student wrote ("review").

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

const respond = (statusCode, body) => ({ statusCode, headers: HEADERS, body: JSON.stringify(body) })

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function cleanList(value, max, maxLen = 280) {
  if (!Array.isArray(value)) return []
  return value
    .filter(v => typeof v === 'string' && v.trim())
    .map(v => v.trim().slice(0, maxLen))
    .slice(0, max)
}

function cleanPairs(value, a, b, max) {
  if (!Array.isArray(value)) return []
  return value
    .map(x => ({ [a]: str(x?.[a], 280), [b]: str(x?.[b], 280) }))
    .filter(x => x[a] && x[b])
    .slice(0, max)
}

function wordCount(text) {
  return (text.match(/\S+/g) || []).length
}

// Turn the client's evidence into a compact, numbered record the model can cite.
function formatEvidence(evidence) {
  const lines = []
  const projects = Array.isArray(evidence?.projects) ? evidence.projects.slice(0, 8) : []
  projects.forEach((p, i) => {
    lines.push(
      `[P${i + 1}] Project "${str(p.title, 120)}" (${str(p.type, 40) || 'project'})` +
      (p.readiness ? ` — AI readiness: ${str(p.readiness, 40)}` : '') +
      `\n  Description: ${str(p.description, 600)}` +
      (p.impact ? `\n  Stated impact: ${str(p.impact, 200)}` : '') +
      (Array.isArray(p.tech) && p.tech.length ? `\n  Tech: ${p.tech.slice(0, 10).map(t => str(t, 30)).join(', ')}` : '')
    )
  })
  const wins = Array.isArray(evidence?.wins) ? evidence.wins.slice(0, 10) : []
  wins.forEach((w, i) => {
    lines.push(`[R${i + 1}] Result: ${str(w.venue, 120)} — ${str(w.result, 160)}${w.project ? ` (project: ${str(w.project, 120)})` : ''}`)
  })
  const activities = Array.isArray(evidence?.activities) ? evidence.activities.slice(0, 12) : []
  activities.forEach((a, i) => {
    lines.push(`[A${i + 1}] Activity (${str(a.type, 60) || 'activity'}): ${str(a.description, 300)}`)
  })
  return lines.join('\n')
}

export const handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' }
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' })
  if (!(await requireUser(event))) return respond(401, { error: 'Sign in to use the application coach.' })

  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) return respond(503, { error: 'The coach is not configured yet (missing GROQ_API_KEY).' })

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return respond(400, { error: 'Invalid request.' })
  }

  const mode = body.mode === 'review' ? 'review' : 'plan'
  const program = str(body.program, 160) || 'an undergraduate program'
  const question = str(body.question, 1500)
  const draft = str(body.draft, 6000)
  const limit = Number.isInteger(body.word_limit) && body.word_limit > 0 && body.word_limit <= 2000
    ? body.word_limit
    : null
  const record = formatEvidence(body.evidence)

  if (!question) return respond(400, { error: 'Paste the question from the application first.' })
  if (mode === 'review' && wordCount(draft) < 15) {
    return respond(400, { error: 'Write at least a few sentences of your own draft to review.' })
  }

  const shared = `You are a straight-talking university admissions advisor helping a high school student with one question on their application to ${program}.

THE QUESTION
${question}
${limit ? `Word limit: ${limit}` : 'Word limit: not given'}

THE STUDENT'S RECORD (the only facts you may rely on; cite items by their [id])
${record || '(The student has not added any projects, results or activities yet.)'}

Hard rules:
- Never invent achievements, numbers, roles or outcomes. If the record doesn't support something, say it's missing.
- Do not write the answer or any sentence the student could paste in. Admissions answers must be the student's own words.
- Be specific to this student and this question; generic advice is useless.`

  const task = mode === 'plan'
    ? `

Plan an answer. Return a JSON object with exactly these keys:
"angle": One sentence naming the strongest overall story this student can tell for THIS question, given their record.
"points": Array of 2-5 objects {"point": "...", "evidence": "...", "why": "..."}. "point" is a short note-form idea (not prose, max ~15 words). "evidence" lists the record ids it draws on, e.g. "P1, R2". "why" says in one sentence why it answers the question.
"gaps": Array of 0-3 strings: things the question asks about that the record can't support yet, with what the student could do or add.
"cautions": Array of 0-3 strings: traps to avoid for this question (e.g. listing tech instead of impact, overclaiming).

Respond with JSON only.`
    : `

THE STUDENT'S DRAFT (${wordCount(draft)} words)
${draft}

Review the draft. Return a JSON object with exactly these keys:
"verdict": One direct sentence on whether this draft answers the question well, and its biggest problem.
"strengths": Array of 0-3 short strings: what genuinely works.
"issues": Array of 1-4 objects {"issue": "...", "fix": "..."}. "issue" names a specific problem (doesn't answer the question, vague, no evidence, generic, structure, over the word limit). "fix" says what to change — describe the change, don't write the replacement text.
"unsupported": Array of 0-4 strings: claims in the draft the record doesn't back up, quoted briefly.
"unused": Array of 0-3 strings: strong items from the record the draft leaves out, with their [id], if they'd help answer this question.

Respond with JSON only.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: shared + task }],
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('application-coach groq error:', response.status, (await response.text()).slice(0, 400))
      return respond(502, { error: 'The AI service rejected the request. Try again in a moment.' })
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')

    if (mode === 'plan') {
      return respond(200, {
        mode,
        angle: str(parsed.angle, 300),
        points: Array.isArray(parsed.points)
          ? parsed.points
              .map(p => ({ point: str(p?.point, 200), evidence: str(p?.evidence, 60), why: str(p?.why, 280) }))
              .filter(p => p.point)
              .slice(0, 5)
          : [],
        gaps: cleanList(parsed.gaps, 3),
        cautions: cleanList(parsed.cautions, 3),
      })
    }

    const words = wordCount(draft)
    return respond(200, {
      mode,
      words,
      over_limit: limit ? words > limit : false,
      verdict: str(parsed.verdict, 400),
      strengths: cleanList(parsed.strengths, 3),
      issues: cleanPairs(parsed.issues, 'issue', 'fix', 4),
      unsupported: cleanList(parsed.unsupported, 4),
      unused: cleanList(parsed.unused, 3),
    })
  } catch (err) {
    console.error('application-coach error:', err)
    return respond(500, { error: 'The coach failed to respond. Please try again.' })
  }
}
