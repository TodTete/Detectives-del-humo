import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAiClient, resolveAiConfig } from './ai.js'
import { createApp } from './app.js'
import { createStore } from './store.js'

try {
  process.loadEnvFile?.()
} catch {
  // Sin archivo .env: se usan las variables del entorno.
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT ?? 8787)
const dataDir = path.resolve(root, process.env.DATA_DIR ?? './data')
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Si la carpeta de datos no se puede usar (permisos, disco de solo lectura), la app no se cae:
 * sigue funcionando y guarda los grupos en memoria hasta que el servidor se reinicie.
 */
async function openStore() {
  try {
    return { store: await createStore({ dataDir }), persistent: true }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(
      `⚠ No se pudo usar la carpeta de datos "${dataDir}" (${reason}). Los grupos se guardarán solo en memoria. Revisa la variable DATA_DIR.`,
    )
    return { store: await createStore({ dataDir: null }), persistent: false }
  }
}

const { store, persistent } = await openStore()
const ai = createAiClient(resolveAiConfig(process.env))
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const app = createApp({
  store,
  ai,
  allowedOrigins,
  staticDir: isProduction ? path.join(root, 'dist') : null,
})

const server = app.listen(port, () => {
  console.info(
    `Detectives del Humo API en http://localhost:${port} · IA ${ai ? `activada (${ai.label}, ${ai.model})` : 'desactivada (modo guía)'} · datos ${persistent ? `en ${dataDir}` : 'solo en memoria'}`,
  )
})

function shutdown() {
  server.close(async () => {
    await store.flush()
    process.exit(0)
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)