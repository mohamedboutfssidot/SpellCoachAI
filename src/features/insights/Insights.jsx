import { useState } from 'react'
import { askCoach } from '../../lib/coach.js'
import { analyze, localPlan, TYPE_LABEL } from './analyze.js'

export default function Insights({ log, onReset }) {
  const a = analyze(log)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const max = a.errorList[0]?.[1] || 1
  const trend = a.recentRate !== null && a.previousRate !== null ? a.recentRate - a.previousRate : null

  const makePlan = async () => {
    setLoading(true)
    try {
      // Seules des statistiques agrégées quittent le navigateur (pas le journal complet).
      const data = await askCoach({
        mode: 'plan',
        stats: { attempts: a.attempts, accuracy: a.accuracy, errors: a.errors, hardWords: a.hardWords.map(x => x.w) },
      })
      if (!data.tips?.length) throw new Error('empty')
      setPlan(data)
    } catch {
      setPlan(localPlan(a))
    }
    setLoading(false)
  }

  if (a.attempts === 0) {
    return (
      <section className="desk">
        <p className="prompt">Aucune donnée pour le moment. Fais quelques dictées, puis reviens ici.</p>
      </section>
    )
  }

  return (
    <section className="desk" aria-label="Progrès">
      <p className="prompt">
        {a.attempts} réponses · {a.accuracy}% de réussite
        {trend !== null && (
          <span className={trend >= 0 ? 'trend up' : 'trend down'}>
            {' '}· {trend >= 0 ? '+' : ''}{trend} pts sur les 10 dernières
          </span>
        )}
      </p>

      <p className="row-label">Dernières réponses</p>
      <div className="dots" role="img" aria-label="Historique des dernières réponses">
        {log.slice(-30).map((e, i) => <span key={i} className={e.ok ? 'dot ok' : 'dot bad'} title={e.w} />)}
      </div>

      {a.errorList.length > 0 && (
        <>
          <p className="row-label">Types d’erreurs</p>
          <div className="bars">
            {a.errorList.map(([type, n]) => (
              <div className="bar-row" key={type}>
                <span>{TYPE_LABEL[type]}</span>
                <div className="bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </>
      )}

      {a.hardWords.length > 0 && (
        <>
          <p className="row-label">Mots les plus ratés</p>
          <div className="chips">
            {a.hardWords.map(x => <span className="chip" key={x.w}>{x.w} ×{x.n}</span>)}
          </div>
        </>
      )}

      <div className="actions" style={{ marginTop: 22 }}>
        <button className="primary" onClick={makePlan} disabled={loading || a.attempts < 3}>
          {loading ? 'Analyse en cours…' : 'Mon plan d’étude'}
        </button>
        <button className="chip" onClick={onReset}>Réinitialiser</button>
        {a.attempts < 3 && <span className="keys">Au moins 3 réponses requises</span>}
      </div>

      {plan && (
        <aside className="coach good" aria-live="polite">
          <p className="verdict">{plan.summary}</p>
          <ol className="plan">
            {plan.tips.map((t, i) => (
              <li key={i}><strong>{t.title}</strong><span>{t.advice}</span></li>
            ))}
          </ol>
          <p className="source">{plan.source === 'ai' ? 'Plan généré par le modèle IA' : 'Plan local (IA indisponible)'}</p>
        </aside>
      )}
    </section>
  )
}
