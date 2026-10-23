// Rangée de tuiles façon jeu de lettres.
// marks : tableau 'ok' | 'bad' | 'miss' (après vérification)
export default function Tiles({ letters, slots = 0, marks, cursor = false, label }) {
  const count = Math.max(letters.length, slots)
  return (
    <div className="tiles" role="img" aria-label={label || letters}>
      {Array.from({ length: count }, (_, i) => {
        const ch = letters[i] || ''
        const state = marks ? marks[i] : ''
        const cls = ['tile', ch ? 'filled' : '', state, cursor && i === letters.length ? 'cursor' : '']
          .filter(Boolean)
          .join(' ')
        return <span key={i} className={cls} style={marks ? { animationDelay: `${i * 45}ms` } : undefined}>{ch}</span>
      })}
      {cursor && letters.length >= count && <span className="tile cursor" />}
    </div>
  )
}
