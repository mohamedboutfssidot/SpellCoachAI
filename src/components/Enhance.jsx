import { useState } from 'react'
import { askCoach } from '../lib/coach.js'
import { speak, speechSupported } from '../lib/speech.js'

export default function Enhance() {
  const [text, setText] = useState('')
  const [state, setState] = useState({ status: 'idle' })

  const run = async () => {
    if (text.trim().length < 3) return
    setState({ status: 'loading' })
    try {
      const data = await askCoach({ mode: 'enhance', text: text.trim() })
      if (!data.improved && !data.corrected) throw new Error('empty')
      setState({ status: 'done', data })
    } catch (err) {
      setState({ status: String(err?.message).includes('429') ? 'quota' : 'error' })
    }
  }

  const d = state.data

  return (
    <section className="desk" aria-label="Enhance it">
      <p className="prompt">Write a sentence in English. The coach corrects it, then makes it sound more natural.</p>
      <textarea
        className="area"
        rows={4}
        maxLength={400}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Yesterday I go to the shop for buy some bread."
        spellCheck={false}
      />
      <div className="actions">
        <button className="primary" onClick={run} disabled={text.trim().length < 3 || state.status === 'loading'}>
          {state.status === 'loading' ? 'Analysing…' : 'Enhance'}
        </button>
        <span className="keys">{text.length}/400</span>
      </div>

      {state.status === 'quota' && (
        <aside className="coach" aria-live="polite">
          <p>The free AI quota is used up for today. Try again later, or add credits to the provider account.</p>
        </aside>
      )}

      {state.status === 'error' && (
        <aside className="coach" aria-live="polite">
          <p>The AI coach is unavailable right now. Check the deployment's API key, then try again.</p>
        </aside>
      )}

      {d && (
        <aside className="coach good" aria-live="polite">
          <p className="row-label">Corrected</p>
          <p className="big">{d.corrected}</p>
          <p className="row-label">More natural</p>
          <p className="big">
            {d.improved}{' '}
            {speechSupported() && d.improved && (
              <button className="chip" onClick={() => speak(d.improved)}>Listen</button>
            )}
          </p>
          {d.changes?.length > 0 && (
            <ul className="changes">
              {d.changes.map((c, i) => (
                <li key={i}>
                  <del>{c.from}</del> <ins>{c.to}</ins>
                  <span>{c.why}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="source">AI model answer</p>
        </aside>
      )}
    </section>
  )
}
