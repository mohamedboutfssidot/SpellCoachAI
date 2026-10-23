// Point d'entrée Cloudflare Workers : route /api/coach vers la même fonction que Pages Functions.
import { onRequestPost } from '../functions/api/coach.js'

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/coach') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
      return onRequestPost({ request, env })
    }
    return env.ASSETS.fetch(request) // le site (dossier dist)
  },
}
