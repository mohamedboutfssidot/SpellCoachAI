import { useEffect, useRef, useState } from 'react'
import { WORDS } from '../data/words.js'
import { speak, speechSupported } from '../lib/speech.js'
import { classify, marksFrom } from '../lib/diff.js'
import { askCoach, localCoach } from '../lib/coach.js'
import Tiles from './Tiles.jsx'

function pickWord(level, review, lastWord) {
  const pool = WORDS[level]
  const due = pool.filter(p => review[p.w] && p.w !== lastWord)
  if (due.length && Math.random() < 0.35) return due[Math.floor(Math.random() * due.length)]
  const options = pool.filter(p => p.w !== lastWord)
  return options[Math.floor(Math.random() * options.length)]
}

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
    <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
  </svg>
)

export default function Dictation({ level, setStats, review, setReview, addLog }) {
  const [entry, setEntry] = useState(() => pickWord(level, review, null))
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null)
  const [coach, setCoach] = useState(null)
  const [hint, setHint] = useState(false)
  const [slow, setSlow] = useState(false)
  const [accent, setAccent] = useState('en-US')
  const [showLength, setShowLength] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const inputRef = useRef(null)
  const reqId = useRef(0)
  const mounted = useRef(false)

  const say = (text, override = {}) =>
    speak(text, {
      accent,
      slow,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      ...override,
    })

  const nextWord = (speakIt) => {
    const e = pickWord(level, review, entry.w)
    reqId.current++
    setEntry(e)
    setValue('')
    setResult(null)
    setCoach(null)
    setHint(false)
    if (speakIt) say(e.w)
    inputRef.current?.focus()
  }

  // Changement de niveau : nouveau mot (sans lecture, l'utilisateur lance l'audio)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    nextWord(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const check = () => {
    const attempt = value.trim().toLowerCase()
    if (!attempt || result) return
    const c = classify(attempt, entry.w)
    const ok = c.type === 'correct'
    setResult({ ...c, ok, attempt, marks: marksFrom(c.ops, attempt.length, entry.w.length) })
    addLog({ w: entry.w, type: c.type, ok })

    setStats(s => {
      const streak = ok ? s.streak + 1 : 0
      return { score: s.score + (ok ? 1 : 0), attempts: s.attempts + 1, streak, best: Math.max(s.best, streak) }
    })
    setReview(r => {
      const n = { ...r }
      if (ok) {
        if (n[entry.w]) { n[entry.w] -= 1; if (n[entry.w] <= 0) delete n[entry.w] }
      } else {
        n[entry.w] = 2 // à réussir 2 fois pour sortir de la liste « à revoir »
      }
      return n
    })

    const id = ++reqId.current
    setCoach({ status: 'loading' })
    askCoach({ mode: 'spell', word: entry.w, attempt, level, correct: ok, errorType: c.type })
      .then(data => id === reqId.current && setCoach({ status: 'done', data }))
      .catch(() => id === reqId.current && setCoach({ status: 'done', data: localCoach(entry, c) }))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      result ? nextWord(true) : check()
    }
  }

  const coachData = coach?.status === 'done' ? coach.data : null

  return (
    <section className="desk" aria-label="Dictée">
      <div className="listen">
        <button
          className={speaking ? 'speak on' : 'speak'}
          onClick={() => say(entry.w)}
          disabled={!speechSupported()}
          aria-label="Écouter le mot"
        >
          <SpeakerIcon />
        </button>
        <div className="listen-side">
          <p className="prompt">
            {speechSupported()
              ? 'Écoute le mot, puis écris-le.'
              : "Ton navigateur ne gère pas la synthèse vocale."}
          </p>
          <div className="chips">
            <button className={slow ? 'chip on' : 'chip'} aria-pressed={slow} onClick={() => setSlow(s => !s)}>Lent</button>
            <button className={accent === 'en-GB' ? 'chip on' : 'chip'} aria-pressed={accent === 'en-GB'} onClick={() => setAccent(a => (a === 'en-US' ? 'en-GB' : 'en-US'))}>
              {accent === 'en-US' ? 'Accent US' : 'Accent UK'}
            </button>
            <button className={showLength ? 'chip on' : 'chip'} aria-pressed={showLength} onClick={() => setShowLength(s => !s)}>Longueur</button>
            <button className={hint ? 'chip on' : 'chip'} aria-pressed={hint} onClick={() => setHint(h => !h)}>Indice</button>
          </div>
          {hint && <p className="hint">En français : {entry.fr}</p>}
        </div>
      </div>

      <label className="field" onClick={() => inputRef.current?.focus()}>
        <span className="sr">Écris le mot que tu entends</span>
        {result ? (
          <div className="answer">
            <p className="row-label">Ta réponse</p>
            <Tiles letters={result.attempt} marks={result.marks.user} label={`Ta réponse : ${result.attempt}`} />
            {!result.ok && (
              <>
                <p className="row-label">Correct</p>
                <Tiles letters={entry.w} marks={result.marks.target} label={`Correct : ${entry.w}`} />
              </>
            )}
          </div>
        ) : (
          <>
            <Tiles letters={value} slots={showLength ? entry.w.length : 0} cursor label="Zone de saisie" />
            <input
              ref={inputRef}
              className="capture"
              value={value}
              onChange={e => setValue(e.target.value.replace(/[^a-zA-Z' -]/g, '').slice(0, entry.w.length + 4))}
              onKeyDown={onKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </>
        )}
      </label>

      <div className="actions">
        {result ? (
          <button className="primary" onClick={() => nextWord(true)} onKeyDown={onKeyDown} autoFocus>Mot suivant</button>
        ) : (
          <button className="primary" onClick={check} disabled={!value.trim()}>Vérifier</button>
        )}
        <span className="keys">Entrée {result ? 'pour continuer' : 'pour vérifier'}</span>
      </div>

      {result && (
        <aside className={result.ok ? 'coach good' : 'coach'} aria-live="polite">
          <p className="verdict">{result.ok ? 'Correct.' : 'Presque.'} <span>« {entry.w} » : {entry.fr}</span></p>
          {coach?.status === 'loading' && <p className="muted">Le coach analyse ta réponse…</p>}
          {coachData && (
            <>
              <p>{coachData.explanation}</p>
              {coachData.tip && <p className="tip">Astuce : {coachData.tip}</p>}
              {coachData.example && (
                <p className="example">
                  <button className="chip" onClick={() => say(coachData.example, { slow: false })}>Écouter</button>
                  <span>{coachData.example}{coachData.example_fr && <em> {coachData.example_fr}</em>}</span>
                </p>
              )}
              <p className="source">{coachData.source === 'ai' ? 'Réponse du modèle IA' : 'Retour local (IA indisponible)'}</p>
            </>
          )}
        </aside>
      )}
    </section>
  )
}
