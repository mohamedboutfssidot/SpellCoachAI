// Cloudflare Workers entry point: routes /api/coach to the same function used by Pages Functions.
import { onRequestPost } from '../functions/api/coach.js'

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/coach') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
      return onRequestPost({ request, env })
    }
    return env.ASSETS.fetch(request) // the website (dist folder)
  },
}
