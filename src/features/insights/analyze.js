// Aggregation of the saved answers (attempt log).
export const TYPE_LABEL = {
  swap: 'Swapped letters',
  double: 'Doubled letter',
  missing: 'Missing letter',
  extra: 'Extra letter',
  wrong: 'Wrong letter',
  multiple: 'Several errors',
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

// Backup when the AI is unavailable: fixed advice based on the main error type.
const ADVICE = {
  swap: 'Read your word letter by letter before you submit it, especially pairs like ie/ei.',
  double: 'Learn double-letter words in groups (necessary, address, accommodate).',
  missing: 'Spell the word out loud, syllable by syllable, before you write it.',
  extra: 'After each mistake, compare your answer with the correct word to spot extra letters.',
  wrong: 'Listen in slow mode and watch for similar vowels (a/e, i/y).',
  multiple: 'Review the word in slow mode, then write it twice from memory.',
}

export function localPlan(a) {
  const tips = a.errorList.slice(0, 3).map(([type]) => ({ title: TYPE_LABEL[type], advice: ADVICE[type] }))
  if (a.hardWords.length) {
    tips.push({ title: 'Words to practice', advice: `Focus on: ${a.hardWords.map(x => x.w).join(', ')}.` })
  }
  return {
    summary: `Your accuracy is ${a.accuracy}% over ${a.attempts} answers.`,
    tips: tips.slice(0, 3),
    source: 'local',
  }
}
