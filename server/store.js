import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Almacenamiento sencillo en un archivo JSON con escrituras atómicas y serializadas.
 * Suficiente para un piloto con pocas escuelas; para producción a escala se recomienda
 * una base de datos administrada (ver README).
 * @param {{ dataDir?: string | null }} [options] dataDir null = solo en memoria (pruebas)
 */
export async function createStore({ dataDir = null } = {}) {
  /** @type {{ groups: Record<string, any>, results: Record<string, any[]> }} */
  let db = { groups: {}, results: {} }
  const file = dataDir ? path.join(dataDir, 'db.json') : null

  if (file) {
    await mkdir(/** @type {string} */ (dataDir), { recursive: true })
    try {
      const raw = await readFile(file, 'utf8')
      const parsed = JSON.parse(raw)
      db = { groups: parsed.groups ?? {}, results: parsed.results ?? {} }
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') throw error
    }
  }

  let queue = Promise.resolve()
  function persist() {
    if (!file) return Promise.resolve()
    const snapshot = JSON.stringify(db)
    queue = queue.then(async () => {
      const tmp = `${file}.${process.pid}.tmp`
      await writeFile(tmp, snapshot, 'utf8')
      await rename(tmp, file)
    })
    return queue
  }

  return {
    /** @param {string} code */
    getGroup(code) {
      return db.groups[code] ?? null
    },
    /** @param {any} group */
    async addGroup(group) {
      db.groups[group.code] = group
      db.results[group.code] ??= []
      await persist()
      return group
    },
    /** @param {string} code */
    getResults(code) {
      return db.results[code] ?? []
    },
    /**
     * Agrega un resultado. Si ya existe uno con el mismo clientId (reintento), no lo duplica.
     * @param {string} code
     * @param {any} result
     * @returns {Promise<{ created: boolean }>}
     */
    async addResult(code, result) {
      const list = (db.results[code] ??= [])
      if (list.some((r) => r.clientId === result.clientId)) return { created: false }
      list.push(result)
      await persist()
      return { created: true }
    },
    flush() {
      return queue
    },
  }
}
