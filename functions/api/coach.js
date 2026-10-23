// Cloudflare Pages Function : proxy sécurisé vers une API compatible OpenAI.
// Fournisseurs gérés : NVIDIA NIM (clé nvapi-...) et OpenRouter (clé sk-or-...).
// Variables Cloudflare : NVIDIA_API_KEY (secret), NVIDIA_MODEL (optionnel), AI_BASE_URL (optionnel).
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'meta/llama-3.1-8b-instruct'

function providerFor(env) {
  const key = env.NVIDIA_API_KEY || ''
  if (env.AI_BASE_URL) return { url: env.AI_BASE_URL, extra: {} }
  if (key.startsWith('sk-or-')) {
    return { url: OPENROUTER_URL, extra: { 'X-Title': 'SpellCoach AI' } }
  }
  return { url: NVIDIA_URL, extra: {} }
}

const SYSTEM =
  'You are SpellCoach, a friendly English spelling and writing coach for French-speaking learners. ' +
  'Answer with ONE valid JSON object only: no markdown, no text before or after. ' +
  'Explanations are written in French, examples in English.'

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')

function buildPrompt(body) {
  if (body.mode === 'spell') {
    const word = String(body.word || '')
    const attempt = String(body.attempt || '')
    if (!/^[a-z]{2,30}$/i.test(word) || !/^[a-z' -]{0,40}$/i.test(attempt)) return null
    const level = ['A', 'B', 'C'].includes(body.level) ? body.level : 'B'
    const lvl = { A: 'A1-A2 beginner', B: 'B1-B2 intermediate', C: 'C1 advanced' }[level]
    const task = body.correct
      ? `The learner spelled "${word}" correctly. Give one short example sentence.`
      : `The learner typed "${attempt}" instead of "${word}". Explain the mistake and give a mnemonic.`
    return (
      `${task} Learner level: ${lvl}.\n` +
      'Return JSON with keys: "explanation" (French, max 2 short sentences), ' +
      '"tip" (short memory trick, French, empty string if correct), ' +
      '"example" (one English sentence using the word), "example_fr" (its French translation).'
    )
  }
  if (body.mode === 'enhance') {
    const text = String(body.text || '').trim()
    if (text.length < 3 || text.length > 400) return null
    return (
      `Learner sentence: """${text}"""\n` +
      'Return JSON with keys: "corrected" (grammar and spelling fixed, minimal edits), ' +
      '"improved" (more natural, fluent English), ' +
      '"changes" (array of up to 5 objects {"from","to","why"} where "why" is a short French explanation).'
    )
  }
  if (body.mode === 'sentence') {
    const level = ['A', 'B', 'C'].includes(body.level) ? body.level : 'B'
    const spec = {
      A: 'A1-A2 beginner, 6 to 9 words, simple present tense',
      B: 'B1-B2 intermediate, 8 to 12 words',
      C: 'C1 advanced, 10 to 15 words, richer vocabulary',
    }[level]
    const focus = (Array.isArray(body.focus) ? body.focus : [])
      .filter(w => typeof w === 'string' && /^[a-z]{2,30}$/i.test(w))
      .slice(0, 3)
    const use = focus.length ? ` Naturally include these words if possible: ${focus.join(', ')}.` : ''
    return (
      `Write ONE short English sentence for a spelling dictation. Level: ${spec}.${use} ` +
      'Use only letters, spaces, apostrophes and basic punctuation (no digits).\n' +
      'Return JSON with keys: "sentence" and "fr" (its French translation).'
    )
  }
  if (body.mode === 'plan') {
    const st = body.stats || {}
    const TYPES = ['swap', 'double', 'missing', 'extra', 'wrong', 'multiple']
    const errors = {}
    for (const t of TYPES) {
      const n = Number(st.errors?.[t])
      if (Number.isFinite(n) && n > 0) errors[t] = Math.min(Math.round(n), 9999)
    }
    const words = (Array.isArray(st.hardWords) ? st.hardWords : [])
      .filter(w => typeof w === 'string' && /^[a-z]{2,30}$/i.test(w))
      .slice(0, 8)
    const attempts = Math.min(Math.max(Math.round(Number(st.attempts) || 0), 0), 99999)
    const accuracy = Math.min(Math.max(Math.round(Number(st.accuracy) || 0), 0), 100)
    if (attempts < 1) return null
    return (
      'A French-speaking learner practiced English spelling dictation. Aggregated statistics (JSON): ' +
      JSON.stringify({ attempts, accuracy_percent: accuracy, error_counts_by_type: errors, hardest_words: words }) +
      '\nError types: swap=two letters swapped, double=doubled letter problem, missing=missing letter, ' +
      'extra=extra letter, wrong=wrong letter, multiple=several differences.\n' +
      'Return JSON with keys: "summary" (one French sentence about their level) and ' +
      '"tips" (array of exactly 3 objects {"title","advice"}, in French, concrete and short, ' +
      'referring to their most frequent error types and hardest words).'
    )
  }
  return null
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('no_json')
  return JSON.parse(match[0])
}

// Liste de modèles à essayer dans l'ordre (NVIDIA_MODEL accepte plusieurs valeurs séparées par des virgules).
function modelsFor(env, provider) {
  const list = (env.NVIDIA_MODEL || DEFAULT_MODEL).split(',').map(m => m.trim()).filter(Boolean)
  if (provider.url === OPENROUTER_URL && !list.includes('openrouter/free')) list.push('openrouter/free')
  return list
}

async function callModel(env, provider, model, prompt) {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
      ...provider.extra,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500, // marge pour les modèles à raisonnement
    }),
  })
  if (!res.ok) throw new Error(`${model} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const msg = data?.choices?.[0]?.message || {}
  return extractJson(msg.content || msg.reasoning || msg.reasoning_content || '')
}

export async function onRequestPost({ request, env }) {
  if (!env.NVIDIA_API_KEY) return json({ error: 'missing_api_key' }, 503)

  let body
  try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400) }

  const prompt = buildPrompt(body)
  if (!prompt) return json({ error: 'bad_request' }, 400)

  const provider = providerFor(env)
  const errors = []
  let parsed = null
  let usedModel = ''
  for (const model of modelsFor(env, provider)) {
    try {
      parsed = await callModel(env, provider, model, prompt)
      usedModel = model
      break
    } catch (err) {
      errors.push(String(err?.message || err).slice(0, 250))
    }
  }
  if (!parsed) return json({ error: 'ai_failed', detail: errors }, 502)

  if (body.mode === 'sentence') {
    return json({ sentence: str(parsed.sentence, 200), fr: str(parsed.fr, 200), source: 'ai', model: usedModel })
  }
  if (body.mode === 'plan') {
    return json({
      summary: str(parsed.summary, 300),
      tips: (Array.isArray(parsed.tips) ? parsed.tips : []).slice(0, 3).map(t => ({
        title: str(t?.title, 80),
        advice: str(t?.advice, 300),
      })),
      source: 'ai',
      model: usedModel,
    })
  }
  if (body.mode === 'spell') {
    return json({
      explanation: str(parsed.explanation, 400),
      tip: str(parsed.tip, 300),
      example: str(parsed.example, 300),
      example_fr: str(parsed.example_fr, 300),
      source: 'ai',
      model: usedModel,
    })
  }
  return json({
    corrected: str(parsed.corrected, 500),
    improved: str(parsed.improved, 500),
    changes: (Array.isArray(parsed.changes) ? parsed.changes : []).slice(0, 5).map(c => ({
      from: str(c?.from, 120),
      to: str(c?.to, 120),
      why: str(c?.why, 250),
    })),
    source: 'ai',
    model: usedModel,
  })
}
