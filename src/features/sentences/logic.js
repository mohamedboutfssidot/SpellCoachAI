// Dictée de phrases : alignement MOT PAR MOT (même idée que Levenshtein, au niveau des mots).
// Le pourcentage correspond à 1 - WER (word error rate), la métrique standard en reconnaissance vocale.
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

// Plan B si l'IA est indisponible.
const bank = (s, fr) => ({ sentence: s, fr })
export const FALLBACK = {
  A: [
    bank('My friend likes breakfast at school.', "Mon ami aime le petit-déjeuner à l'école."),
    bank('The weather is beautiful tomorrow.', 'Le temps sera beau demain.'),
    bank('People in my country are very friendly.', 'Les gens de mon pays sont très sympathiques.'),
    bank('My family has a different answer.', 'Ma famille a une réponse différente.'),
  ],
  B: [
    bank('I believe it is necessary to protect the environment.', "Je crois qu'il est nécessaire de protéger l'environnement."),
    bank('The government will receive the schedule tomorrow.', "Le gouvernement recevra l'emploi du temps demain."),
    bank('Send me your address and I will definitely reply.', 'Envoie-moi ton adresse et je répondrai certainement.'),
    bank('Knowledge is a real achievement.', 'Le savoir est une vraie réussite.'),
  ],
  C: [
    bank('Good pronunciation requires perseverance and a steady rhythm.', 'Une bonne prononciation demande de la persévérance et un rythme régulier.'),
    bank('The questionnaire contained miscellaneous questions about sovereignty.', 'Le questionnaire contenait des questions diverses sur la souveraineté.'),
    bank('Surveillance should never become an unnecessary privilege.', 'La surveillance ne devrait jamais devenir un privilège inutile.'),
    bank('The entrepreneur found the bureaucracy exhausting.', "L'entrepreneur a trouvé la bureaucratie épuisante."),
  ],
}

export function pickFallback(level, last) {
  const pool = FALLBACK[level].filter(x => x.sentence !== last)
  return pool[Math.floor(Math.random() * pool.length)]
}
