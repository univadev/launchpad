exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  // Default safe response — if anything fails, content submits normally
  const safeFallback = {
    statusCode: 200,
    headers,
    body: JSON.stringify({ is_safe: true, reason: null })
  }

  try {
    const body = JSON.parse(event.body)
    const { content } = body

    if (!content) return safeFallback

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) return safeFallback

    const prompt = `You are a content moderator for a platform for high school students sharing STEM and business projects.

Review this content and determine if it is safe for the platform:
"${content.slice(0, 1000)}"

The content is UNSAFE if it contains: hate speech, harassment, explicit sexual content, calls for violence, personal attacks, spam, or promotion of harmful activities.

Normal content about coding, projects, science, business, competition, challenges, or frustrations is SAFE.

Respond with JSON only: {"is_safe": true/false, "reason": "brief reason if unsafe, null if safe"}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content

    if (!rawContent) return safeFallback

    const parsed = JSON.parse(rawContent)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        is_safe: parsed.is_safe !== false,
        reason: parsed.reason || null,
      })
    }
  } catch (err) {
    // On any error, allow content through
    console.error('moderate-content error:', err)
    return safeFallback
  }
}
