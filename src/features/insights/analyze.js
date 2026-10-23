// Agrégation des réponses enregistrées (journal des tentatives).
export const TYPE_LABEL = {
  swap: 'Lettres inversées',
  double: 'Lettre doublée',
  missing: 'Lettre manquante',
  extra: 'Lettre en trop',
  wrong: 'Lettre incorrecte',
  multiple: 'Plusieurs erreurs',
}

export function analyze(log) {
  const errors = {}
  const misses = {}
  for (const e of log) {
    if (e.ok) continue
    errors[e.type] = (errors[e.type] || 0) + 1
    misses[e.w] = (misses[e.w] || 0) + 1
  }
  const rate = arr => (arr.length ? Math.round((arr.filter(e => e.ok).length / arr.length) * 100) : null)
  const recent = log.slice(-10)
  const before = log.slice(-20, -10)
  return {
    attempts: log.length,
    accuracy: rate(log) ?? 0,
    errors,
    errorList: Object.entries(errors).sort((a, b) => b[1] - a[1]),
    hardWords: Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w, n]) => ({ w, n })),
    recentRate: rate(recent),
    previousRate: rate(before),
  }
}

// Plan B si l'IA est indisponible : conseils fixes selon l'erreur dominante.
const ADVICE = {
  swap: 'Relis ton mot lettre par lettre avant de valider, surtout les paires comme ie/ei.',
  double: 'Apprends les mots à lettres doubles par groupes (necessary, address, accommodate).',
  missing: 'Épelle le mot à voix haute, syllabe par syllabe, avant de l’écrire.',
  extra: 'Compare ta réponse au mot correct après chaque erreur pour repérer les lettres en trop.',
  wrong: 'Écoute en mode lent et fais attention aux voyelles proches (a/e, i/y).',
  multiple: 'Revois le mot en mode lent, puis réécris-le deux fois de mémoire.',
}

export function localPlan(a) {
  const tips = a.errorList.slice(0, 3).map(([type]) => ({ title: TYPE_LABEL[type], advice: ADVICE[type] }))
  if (a.hardWords.length) {
    tips.push({ title: 'Mots à retravailler', advice: `Concentre-toi sur : ${a.hardWords.map(x => x.w).join(', ')}.` })
  }
  return {
    summary: `Tu as une réussite de ${a.accuracy}% sur ${a.attempts} réponses.`,
    tips: tips.slice(0, 3),
    source: 'local',
  }
}
