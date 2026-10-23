import { useEffect, useRef, useState } from 'react'
import { askCoach } from '../../lib/coach.js'
import { speak, speechSupported } from '../../lib/speech.js'
import { scoreSentence, pickFallback } from './logic.js'

function Words({ words, marks }) {
  return (
    <div className="words">
      {words.map((w, i) => <span key={i} className={`w ${marks[i]}`}>{w}</span>)}
    </div>
  )
}

export default function Sentences({ level, review }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null)
  const [slow, setSlow] = useState(false)
  const [showFr, setShowFr] = useState(false)
  const inputRef = useRef(null)
  const reqId = useRef(0)

  // Changement de niveau : on repart de zéro
  useEffect(() => {
    reqId.current++
    setItem(null); setResult(null); setValue(''); setLoading(false)
  }, [level])

  const say = (text = item?.sentence, o = {}) => text && speak(text, { slow, ...o })

  const load = async () => {
    const id = ++reqId.current
    setLoading(true); setValue(''); setResult(null); setShowFr(false)
    const focus = Object.keys(review).filter(w => /^[a-z]{2,30}$/.test(w)).slice(0, 3)
    let next
    try {
      const d = await askCoach({ mode: 'sentence', level, focus })
      if (!d.sentence || d.sentence.trim().split(/\s+/).length > 20) throw new Error('bad_sentence')
      next = { sentence: d.sentence.trim(), fr: d.fr, source: 'ai' }
    } catch {
      next = { ...pickFallback(level, item?.sentence), source: 'local' }
    }
    if (id !== reqId.current) return
    setItem(next)
    setLoading(false)
    speak(next.sentence, { slow })
    inputRef.current?.focus()
  }

  const check = () => {
    if (!item || !value.trim() || result) return
    setResult(scoreSentence(value, item.sentence))
  }

  const onKeyDown = e => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    result ? load() : check()
  }

  return (
    <section className="desk" aria-label="Dictée de phrases">
      <p className="prompt">Écoute la phrase entière, puis écris-la. Le score se calcule mot par mot.</p>

      {!item ? (
        <div className="actions">
          <button className="primary" onClick={load} disabled={loading}>
            {loading ? 'Génération…' : 'Générer une phrase'}
          </button>
        </div>
      ) : (
        <>
          <div className="chips">
            <button className="chip" onClick={() => say()} disabled={!speechSupported()}>Réécouter</button>
            <button className={slow ? 'chip on' : 'chip'} aria-pressed={slow} onClick={() => setSlow(s => !s)}>Lent</button>
            <button className={showFr ? 'chip on' : 'chip'} aria-pressed={showFr} onClick={() => setShowFr(f => !f)}>Indice FR</button>
          </div>
          {showFr && <p className="hint">{item.fr}</p>}

          <textarea
            ref={inputRef}
            className="area"
            rows={2}
            value={value}
            onChange={e => !result && setValue(e.target.value.slice(0, 200))}
            onKeyDown={onKeyDown}
            readOnly={!!result}
            placeholder="Tape la phrase entendue…"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="actions">
            {result ? (
              <button className="primary" onClick={load} disabled={loading} autoFocus>
                {loading ? 'Génération…' : 'Phrase suivante'}
              </button>
            ) : (
              <button className="primary" onClick={check} disabled={!value.trim()}>Vérifier</button>
            )}
            <span className="keys">Entrée {result ? 'pour continuer' : 'pour vérifier'}</span>
          </div>
        </>
      )}

      {result && (
        <aside className={result.pct === 100 ? 'coach good' : 'coach'} aria-live="polite">
          <p className="verdict">
            {result.pct}% <span>({result.t.length - Math.min(result.distance, result.t.length)}/{result.t.length} mots justes)</span>
          </p>
          {result.pct < 100 && (
            <>
              <p className="row-label">Ta réponse</p>
              <Words words={result.a} marks={result.user} />
            </>
          )}
          <p className="row-label">Phrase correcte</p>
          <Words words={result.t} marks={result.tgt} />
          <p className="muted">{item.fr}</p>
          <p className="source">{item.source === 'ai' ? 'Phrase générée par le modèle IA' : 'Phrase de secours (IA indisponible)'}</p>
        </aside>
      )}
    </section>
  )
}
