import { useEffect, useState } from 'react'
import { englishVoices, getVoiceSettings, saveVoiceSettings, speak, speechSupported } from '../lib/speech.js'

export default function VoiceSettings() {
  const [settings, setSettings] = useState(getVoiceSettings)
  const [voices, setVoices] = useState([])

  // Voices load asynchronously in some browsers
  useEffect(() => {
    if (!speechSupported()) return
    const load = () => setVoices(englishVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const update = patch => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveVoiceSettings(next)
  }

  if (!speechSupported()) return null

  return (
    <details className="voice">
      <summary>Voice settings</summary>
      <div className="voice-body">
        <label>
          <span>Voice</span>
          <select value={settings.choice} onChange={e => update({ choice: e.target.value })}>
            <option value="auto:en-US">Automatic (US)</option>
            <option value="auto:en-GB">Automatic (UK)</option>
            {voices.map(v => (
              <option key={v.name + v.lang} value={`voice:${v.name}`}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </label>
        <label>
          <span>Speed: {settings.rate.toFixed(2)}</span>
          <input
            type="range"
            min="0.5"
            max="1.3"
            step="0.05"
            value={settings.rate}
            onChange={e => update({ rate: Number(e.target.value) })}
          />
        </label>
        <button className="chip" onClick={() => speak('Hello! This is how I sound.')}>Test voice</button>
      </div>
    </details>
  )
}
