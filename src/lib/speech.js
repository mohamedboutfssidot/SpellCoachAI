// Synthèse vocale native du navigateur : gratuite, sans clé, sans serveur.
export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.replace('_', '-') === lang) ||
    voices.find(v => v.lang.startsWith('en'))
  )
}

export function speak(text, { accent = 'en-US', slow = false, onStart, onEnd } = {}) {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = accent
  const voice = pickVoice(accent)
  if (voice) u.voice = voice
  u.rate = slow ? 0.55 : 0.9
  u.onstart = () => onStart?.()
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}
