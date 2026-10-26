// AI coach client: calls the /api/coach server function (the API key stays on the server).
export async function askCoach(payload) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 35000)
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() // throws if the response is not JSON (e.g. dev mode without the function)
  } finally {
    clearTimeout(timer)
  }
}

// Offline backup: rule-based teaching feedback, no AI.
export function localCoach(entry, result) {
  const missing = result.ops
    .filter(o => o.type === 'missing')
    .map(o => entry.w[o.t])
    .join(', ')
  const messages = {
    correct: `Well done! "${entry.w}" means: ${entry.def}.`,
    swap: 'Two letters next to each other are swapped. Read the word again, letter by letter.',
    double: 'This is a doubled-letter problem. Check which letter repeats.',
    missing: `A letter is missing: ${missing}.`,
    extra: 'You added an extra letter.',
    wrong: 'One letter is wrong. Listen again in slow mode.',
    multiple: 'Several letters are different. Listen in slow mode and split the word into syllables.',
  }
  return {
    explanation: messages[result.type] || messages.multiple,
    tip: '',
    example: '',
    source: 'local',
  }
}
