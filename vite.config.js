import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const FUNCTIONS_DIR = resolve(process.cwd(), 'netlify/functions')

// Serve netlify/functions at /api/* during `npm run dev`.
//
// In production netlify.toml redirects /api/* to the deployed functions. Without
// this, plain Vite returns index.html for /api/... and every AI call fails with a
// confusing HTML-instead-of-JSON error. Modules are re-imported per request with a
// cache-busting query so edits to a function take effect without a server restart.
function netlifyFunctions(env) {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      if (!existsSync(FUNCTIONS_DIR)) return

      const available = readdirSync(FUNCTIONS_DIR)
        .filter(f => f.endsWith('.js'))
        .map(f => f.replace(/\.js$/, ''))

      // Functions read secrets from process.env; mirror .env values in for dev.
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }

      server.middlewares.use('/api', async (req, res, next) => {
        const name = req.url.split('?')[0].replace(/^\//, '')
        if (!available.includes(name)) return next()

        let body = ''
        for await (const chunk of req) body += chunk

        try {
          const mod = await import(
            `${pathToFileURL(resolve(FUNCTIONS_DIR, `${name}.js`)).href}?t=${Date.now()}`
          )
          const result = await mod.handler({
            httpMethod: req.method,
            headers: req.headers,
            body: body || null,
          })
          res.statusCode = result.statusCode || 200
          for (const [k, v] of Object.entries(result.headers || {})) res.setHeader(k, v)
          res.end(result.body || '')
        } catch (err) {
          console.error(`[api/${name}]`, err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Local function failed', details: err.message }))
        }
      })

      server.config.logger.info(
        `  \x1b[32m➜\x1b[0m  \x1b[1mapi\x1b[0m:     /api/{${available.join(',')}}`
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load every var, not just VITE_-prefixed ones, so server-side keys
  // (GROQ_API_KEY) reach the functions in local dev.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), netlifyFunctions(env)],
    server: {
      port: 5173,
      host: true,
    },
  }
})
