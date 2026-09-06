// Groq retired the Llama chat models; gpt-oss-120b is the strongest one now
// available for this account. Override with GROQ_MODEL if that changes again.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function clampScore(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 3
  return Math.max(1, Math.min(5, n))
}

const READINESS_LABELS = {
  1: 'Idea stage',
  2: 'Early build',
  3: 'Working project',
  4: 'Polished & validated',
  5: 'Competition ready',
}

// Keep only strings, trimmed and capped, so a chatty model can't blow up the UI.
function cleanList(value, max, maxLen = 240) {
  if (!Array.isArray(value)) return []
  return value
    .filter(v => typeof v === 'string' && v.trim())
    .map(v => v.trim().slice(0, maxLen))
    .slice(0, max)
}

function cleanGaps(value, max = 4) {
  if (!Array.isArray(value)) return []
  return value
    .map(g => ({
      issue: typeof g?.issue === 'string' ? g.issue.trim().slice(0, 200) : '',
      fix: typeof g?.fix === 'string' ? g.fix.trim().slice(0, 280) : '',
    }))
    .filter(g => g.issue && g.fix)
    .slice(0, max)
}

export const handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      title,
      description,
      tech_stack = [],
      project_type = '',
      impact_metrics = '',
      link = '',
      candidates = [],
    } = body

    if (!title || !description) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: 'title and description required' }),
      }
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return {
        statusCode: 503,
        headers: HEADERS,
        body: JSON.stringify({ error: 'AI feedback is not configured yet (missing GROQ_API_KEY).' }),
      }
    }

    // The model may only choose from venues the client sent. Anything else is dropped
    // below, so it cannot invent a competition or journal that does not exist.
    const allowedIds = new Set(candidates.map(c => c.id))
    const venueMenu = candidates
      .map(c => `- ${c.id} | ${c.name} (${c.kind}, selectivity ${c.selectivity}/5) — ${c.blurb}`)
      .join('\n')

    const prompt = `You are a blunt, experienced mentor reviewing a high school student's project. Your job is honest critique, not encouragement. Students are hurt more by vague praise than by direct feedback.

PROJECT
Title: ${title}
Type: ${project_type || 'Unspecified'}
Tech: ${tech_stack.join(', ') || 'Not specified'}
Stated impact: ${impact_metrics || 'None provided'}
Link: ${link || 'None provided'}
Description: ${description}

Return a JSON object with exactly these keys:

"verdict": One direct sentence assessing what this project actually is right now. No flattery. If the description is too vague to evaluate, say exactly that.

"readiness": Integer 1-5. 1 = just an idea, 2 = early build, 3 = working project, 4 = polished and validated with real users or results, 5 = genuinely competition-ready with rigorous evidence. Most student projects are a 2 or a 3. Do not inflate this; a 4 or 5 requires stated evidence of real users, measured results, or rigorous method.

"readiness_rationale": One sentence explaining the score, citing what is present or missing.

"strengths": Array of 1-3 short strings. Only genuine strengths. If there are none worth naming, return an empty array.

"gaps": Array of 2-4 objects, each {"issue": "...", "fix": "..."}. The single most valuable part of your response. "issue" names a specific weakness — unmeasured impact, no evaluation, unclear problem, trivial scope, missing comparison to existing solutions. "fix" is one concrete action to take this week. Be specific to THIS project; generic advice is useless.

"skills_demonstrated": Array of 2-4 short strings — concrete skills a college or internship reviewer would credit.

"venue_ids": Array of 4-6 ids chosen ONLY from the list below, matched to this project's subject.
Give a real spread, not just the easy options:
- At least one selective venue (selectivity 3+) as something to aim for.
- Prefer a subject-specific competition or journal over a general showcase when one fits.
- Include general showcases (hackathon sites, communities) as at most half the list.
Use each id exactly as written. Never invent an id.

AVAILABLE VENUES
${venueMenu}

Respond with JSON only.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1300,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('groq error:', response.status, detail.slice(0, 400))
      return {
        statusCode: 502,
        headers: HEADERS,
        body: JSON.stringify({ error: 'The AI service rejected the request. Try again in a moment.' }),
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from AI')

    const parsed = JSON.parse(content)
    const readiness = clampScore(parsed.readiness)

    // Drop any id the model invented or duplicated.
    const venueIds = Array.isArray(parsed.venue_ids)
      ? [...new Set(parsed.venue_ids.filter(id => allowedIds.has(id)))].slice(0, 6)
      : []

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        verdict: typeof parsed.verdict === 'string' ? parsed.verdict.trim().slice(0, 400) : '',
        readiness,
        readiness_label: READINESS_LABELS[readiness],
        readiness_rationale:
          typeof parsed.readiness_rationale === 'string'
            ? parsed.readiness_rationale.trim().slice(0, 300)
            : '',
        strengths: cleanList(parsed.strengths, 3),
        gaps: cleanGaps(parsed.gaps),
        skills_demonstrated: cleanList(parsed.skills_demonstrated, 4, 120),
        venue_ids: venueIds,
      }),
    }
  } catch (err) {
    console.error('analyze-project error:', err)
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Feedback failed to generate. Please try again.' }),
    }
  }
}
