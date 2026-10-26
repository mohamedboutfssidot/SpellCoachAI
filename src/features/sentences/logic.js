// Sentence dictation: WORD-BY-WORD alignment (same idea as Levenshtein, applied to words).
// The percentage is 1 - WER (word error rate), the standard metric in speech recognition.
const tokens = s =>
  s.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean)

export function scoreSentence(attempt, target) {
  const a = tokens(attempt)
  const t = tokens(target)
  const n = a.length
  const m = t.length
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 0; i <= n; i++) d[i][0] = i
  for (let j = 0; j <= m; j++) d[0][j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === t[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  const user = new Array(n).fill('ok')
  const tgt = new Array(m).fill('ok')
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === t[j - 1] && d[i][j] === d[i - 1][j - 1]) { i--; j-- }
    else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) { user[i - 1] = 'bad'; tgt[j - 1] = 'miss'; i--; j-- }
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { user[i - 1] = 'bad'; i-- }
    else { tgt[j - 1] = 'miss'; j-- }
  }
  const wer = m ? d[n][m] / m : 1
  return { a, t, user, tgt, distance: d[n][m], pct: Math.max(0, Math.round((1 - wer) * 100)) }
}

// Backup sentences used when the AI is unavailable.
export const FALLBACK = {
  A: [
    'My friend likes breakfast at school.',
    'The weather is beautiful tomorrow.',
    'People in my country are very friendly.',
    'My family has a different answer.',
    'We eat vegetables for dinner together.',
    'Yesterday I listened to music in the kitchen.',
    'My daughter rides her bicycle on her birthday.',
    'We have a quiet holiday in February.',
    'I drink orange juice every morning.',
    'Is there enough time for a sandwich?',
    'She walked through the library to find a book.',
    'Wednesday is my busiest day.',
  ],
  B: [
    'I believe it is necessary to protect the environment.',
    'The government will receive the schedule tomorrow.',
    'Send me your address and I will definitely reply.',
    'Knowledge is a real achievement.',
    'The committee will recommend a new calendar immediately.',
    'It is hard to feel comfortable when the temperature drops.',
    'This is a great opportunity to build your vocabulary.',
    'Unfortunately, the restaurant closes before the show.',
    'Taking responsibility is part of becoming independent.',
    'I sincerely hope you will not disappear again.',
    'He did not want to embarrass his colleague.',
    'My experience taught me that success takes patience.',
  ],
  C: [
    'Good pronunciation requires perseverance and a steady rhythm.',
    'The questionnaire contained miscellaneous questions about sovereignty.',
    'Surveillance should never become an unnecessary privilege.',
    'The entrepreneur found the bureaucracy exhausting.',
    'A conscientious assistant manages the correspondence with care.',
    'Regular maintenance prevents a single occurrence from becoming a disaster.',
    'The hotel will accommodate every acquaintance on the guest list.',
    'He tends to exaggerate, but his mischievous humor charms everyone.',
    'The silhouette appeared at the threshold of the old building.',
    'A strict hierarchy can supersede individual judgment.',
    'Her idiosyncrasy was reading under fluorescent lights.',
    'The new millennium changed how doctors treat pneumonia.',
  ],
}

export function pickFallback(level, last) {
  const pool = FALLBACK[level].filter(s => s !== last)
  return { sentence: pool[Math.floor(Math.random() * pool.length)] }
}
