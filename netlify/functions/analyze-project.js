const Groq = require('groq-sdk')

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  try {
    const body = JSON.parse(event.body)
    const { title, description, tech_stack = [], project_type = '' } = body

    if (!title || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'title and description required' })
      }
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: 'AI analysis not configured' })
      }
    }

    const prompt = `You are an expert mentor for high school students building STEM and business projects.

Analyze this project and provide concise, insightful feedback in 3 areas:

Project: "${title}"
Description: "${description}"
Type: ${project_type}
Tech Stack: ${tech_stack.join(', ') || 'Not specified'}

Respond with a JSON object with exactly these 3 keys:
- impact_suggestions: 1-2 sentences on how to measure or communicate impact more powerfully
- skills_demonstrated: 2-3 specific technical/professional skills this project demonstrates (for college apps / internships)
- similar_projects: 1-2 sentences on similar open-source or published work they could study or collaborate with

Be specific, practical, and encouraging. No fluff. JSON only.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        impact_suggestions: parsed.impact_suggestions || '',
        skills_demonstrated: parsed.skills_demonstrated || '',
        similar_projects: parsed.similar_projects || '',
      })
    }
  } catch (err) {
    console.error('analyze-project error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Analysis failed', details: err.message })
    }
  }
}
