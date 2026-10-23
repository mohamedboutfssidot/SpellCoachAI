import { useState } from 'react'
import Dictation from './components/Dictation.jsx'
import Enhance from './components/Enhance.jsx'
import Sentences from './features/sentences/Sentences.jsx'
import Insights from './features/insights/Insights.jsx'
import { LEVELS } from './data/words.js'
import { useStored } from './lib/storage.js'

const MODES = [
  { id: 'dictation', label: 'Mots' },
  { id: 'sentences', label: 'Phrases' },
  { id: 'insights', label: 'Progrès' },
  { id: 'enhance', label: 'Enhance it' },
]

const EMPTY_STATS = { score: 0, attempts: 0, streak: 0, best: 0 }

export default function App() {
  const [mode, setMode] = useState('dictation')
  const [level, setLevel] = useStored('sc.level', 'A')
  const [stats, setStats] = useStored('sc.stats', EMPTY_STATS)
  const [review, setReview] = useStored('sc.review', {})
  const [log, setLog] = useStored('sc.log', [])

  const addLog = entry => setLog(l => [...l, entry].slice(-300))
  const resetAll = () => {
    if (!window.confirm('Effacer toute ta progression ?')) return
    setStats(EMPTY_STATS); setReview({}); setLog([])
  }

  const toReview = Object.keys(review).length
  const accuracy = stats.attempts ? Math.round((stats.score / stats.attempts) * 100) : 0
  const needsLevel = mode === 'dictation' || mode === 'sentences'

  return (
    <div className="shell">
      <header className="top">
        <h1 className="brand">SpellCoach<span> AI</span></h1>
        <nav className="tabs" aria-label="Mode">
          {MODES.map(m => (
            <button
              key={m.id}
              className={mode === m.id ? 'tab on' : 'tab'}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </header>

      <dl className="stats" aria-label="Progression">
        <div><dt>Réussite</dt><dd>{accuracy}%</dd></div>
        <div><dt>Série</dt><dd>{stats.streak}</dd></div>
        <div><dt>Record</dt><dd>{stats.best}</dd></div>
        <div><dt>À revoir</dt><dd>{toReview}</dd></div>
      </dl>

      {needsLevel && (
        <div className="levels" role="group" aria-label="Niveau">
          {LEVELS.map(l => (
            <button
              key={l.id}
              className={level === l.id ? 'lvl on' : 'lvl'}
              aria-pressed={level === l.id}
              onClick={() => setLevel(l.id)}
            >
              <strong>{l.label}</strong>
              <small>{l.hint}</small>
            </button>
          ))}
        </div>
      )}

      {mode === 'dictation' && (
        <Dictation level={level} setStats={setStats} review={review} setReview={setReview} addLog={addLog} />
      )}
      {mode === 'sentences' && <Sentences level={level} review={review} />}
      {mode === 'insights' && <Insights log={log} onReset={resetAll} />}
      {mode === 'enhance' && <Enhance />}

      <footer className="foot">
        Voix : Web Speech API · Coach : modèle IA via Cloudflare Pages Functions
      </footer>
    </div>
  )
}
