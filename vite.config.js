import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lit .dev.vars (KEY=VALUE) pour simuler les variables Cloudflare en local.
function readDevVars() {
  try {
    return Object.fromEntries(
      readFileSync('.dev.vars', 'utf8')
        .split(/\r?\n/)
        .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
        .map(l => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        })
    )
  } catch {
    return {}
  }
}

// En dev, exécute la même Pages Function (functions/api/coach.js) sans wrangler.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/coach', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        const chunks = []
        for await (const c of req) chunks.push(c)
        const request = new Request('http://localhost/api/coach', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: Buffer.concat(chunks),
        })
        const { onRequestPost } = await server.ssrLoadModule('/functions/api/coach.js')
        const r = await onRequestPost({ request, env: readDevVars() })
        res.statusCode = r.status
        r.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await r.arrayBuffer()))
      })
    },
  }
}

export default defineConfig({ plugins: [react(), localApi()] })
