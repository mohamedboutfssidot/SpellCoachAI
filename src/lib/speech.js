// Browser speech synthesis: free, no key, no server.
// Settings (voice, speed) are saved in localStorage and read at every playback.
const KEY = 'sc.voice'
export const DEFAULT_VOICE = { choice: 'auto:en-US', rate: 0.9 }

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

export function getVoiceSettings() {
  try {
    return { ...DEFAULT_VOICE, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULT_VOICE
  }
}

export function saveVoiceSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* ignore */ }
}

const norm = lang => lang.replace('_', '-')

// English voices available on this device
export function englishVoices() {
  if (!speechSupported()) return []
  return window.speechSynthesis
    .getVoices()
    .filter(v => norm(v.lang).toLowerCase().startsWith('en'))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function resolve(settings) {
  const voices = window.speechSynthesis.getVoices()
  if (settings.choice.startsWith('voice:')) {
    const v = voices.find(x => x.name === settings.choice.slice(6))
    if (v) return { voice: v, lang: v.lang }
  }
  const lang = settings.choice.startsWith('auto:') ? settings.choice.slice(5) : 'en-US'
  const sameLang = voices.filter(v => norm(v.lang) === lang)
  // In auto mode we prefer "Natural" (Edge) or "Google" (Chrome) voices, usually better
  const voice =
    sameLang.find(v => /natural|google/i.test(v.name)) ||
    sameLang[0] ||
    voices.find(v => norm(v.lang).startsWith('en'))
  return { voice, lang }
}

export function speak(text, { slow = false, onStart, onEnd } = {}) {
  if (!speechSupported()) return
  const settings = getVoiceSettings()
  const { voice, lang } = resolve(settings)
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  if (voice) u.voice = voice
  u.rate = slow ? Math.max(0.4, settings.rate * 0.6) : settings.rate
  u.onstart = () => onStart?.()
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}
