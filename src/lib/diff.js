// Letter-by-letter alignment (Levenshtein distance + backtrace).
export function align(attempt, target) {
  const a = attempt.toLowerCase()
  const t = target.toLowerCase()
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
  const ops = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === t[j - 1] && d[i][j] === d[i - 1][j - 1]) {
      ops.push({ type: 'match', a: i - 1, t: j - 1 }); i--; j--
    } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
      ops.push({ type: 'sub', a: i - 1, t: j - 1 }); i--; j--
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ type: 'extra', a: i - 1 }); i--
    } else {
      ops.push({ type: 'missing', t: j - 1 }); j--
    }
  }
  ops.reverse()
  return { distance: d[n][m], ops }
}

const hasAdjacentSwap = (attempt, target) => {
  for (let i = 0; i < attempt.length - 1; i++) {
    const s = attempt.slice(0, i) + attempt[i + 1] + attempt[i] + attempt.slice(i + 2)
    if (s === target) return true
  }
  return false
}

// Error type: correct | swap | double | missing | extra | wrong | multiple
export function classify(attempt, target) {
  const a = attempt.toLowerCase()
  const t = target.toLowerCase()
  const { distance, ops } = align(a, t)
  if (distance === 0) return { type: 'correct', distance, ops }
  if (distance === 2 && hasAdjacentSwap(a, t)) return { type: 'swap', distance, ops }
  if (distance === 1) {
    const miss = ops.find(o => o.type === 'missing')
    if (miss) {
      const c = t[miss.t]
      return { type: t[miss.t - 1] === c || t[miss.t + 1] === c ? 'double' : 'missing', distance, ops }
    }
    const extra = ops.find(o => o.type === 'extra')
    if (extra) {
      const c = a[extra.a]
      return { type: a[extra.a - 1] === c || a[extra.a + 1] === c ? 'double' : 'extra', distance, ops }
    }
    return { type: 'wrong', distance, ops }
  }
  return { type: 'multiple', distance, ops }
}

// Tile colors: the "your answer" row and the "correct" row
export function marksFrom(ops, attemptLen, targetLen) {
  const user = new Array(attemptLen).fill('ok')
  const target = new Array(targetLen).fill('ok')
  for (const o of ops) {
    if (o.type === 'sub') { user[o.a] = 'bad'; target[o.t] = 'miss' }
    if (o.type === 'extra') user[o.a] = 'bad'
    if (o.type === 'missing') target[o.t] = 'miss'
  }
  return { user, target }
}
