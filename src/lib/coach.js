// Client du coach IA : appelle la Pages Function /api/coach (la clé NVIDIA reste côté serveur).
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
    return await res.json() // lève une erreur si la réponse n'est pas du JSON (ex. mode dev sans Functions)
  } finally {
    clearTimeout(timer)
  }
}

// Plan B hors-ligne : retour pédagogique basé sur des règles, sans IA.
export function localCoach(entry, result) {
  const missing = result.ops
    .filter(o => o.type === 'missing')
    .map(o => entry.w[o.t])
    .join(', ')
  const messages = {
    correct: `Bien joué. « ${entry.w} » signifie « ${entry.fr} ».`,
    swap: 'Deux lettres voisines sont inversées. Relis le mot lettre par lettre.',
    double: 'Problème de lettre doublée : vérifie quelle lettre se répète.',
    missing: `Il manque une lettre : ${missing}.`,
    extra: 'Tu as ajouté une lettre en trop.',
    wrong: 'Une lettre est incorrecte. Écoute le mot en mode lent.',
    multiple: 'Plusieurs lettres diffèrent. Écoute en mode lent et découpe le mot en syllabes.',
  }
  return {
    explanation: messages[result.type] || messages.multiple,
    tip: '',
    example: '',
    example_fr: '',
    source: 'local',
  }
}
