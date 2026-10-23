import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guideAnswer, isCrisis } from '../../shared/guide.js'
import { normalize, searchFacts, tokenize } from '../../shared/kb-search.js'
import { ApiError } from './api'
import { addDays, daysBetween, formatMoney, toISODate } from './dates'
import { FACTS, SOURCES, sourcesForFacts } from './knowledge'
import { enqueueResult, flushQueue, queueStore } from './resultsQueue'
import { createPersistentStore, readJSON, writeJSON } from './storage'

describe('fechas', () => {
  it('suma días y calcula diferencias sin errores de horario de verano', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(daysBetween('2026-04-01', '2026-04-08')).toBe(7)
    expect(toISODate(new Date(2026, 9, 5))).toBe('2026-10-05')
    expect(formatMoney(1234)).toMatch(/1,234/)
  })
})

describe('guía verificada', () => {
  it('todas las fuentes citadas existen', () => {
    const ids = new Set(SOURCES.map((s) => s.id))
    for (const f of FACTS) for (const s of f.sources) expect(ids.has(s)).toBe(true)
    expect(sourcesForFacts(['antojos', 'estrategias']).map((s) => s.id)).toEqual(['medlineplus'])
  })

  it('normaliza acentos y busca por palabras clave', () => {
    expect(normalize('¿Cuánto DURAN?')).toBe(' cuanto duran ')
    expect(tokenize('¿El vapor es solo agua?')).toEqual(['vapor', 'solo', 'agua'])
    expect(searchFacts('¿el vapor es solo agua?', FACTS)[0]?.id).toBe('vapor-no-es-agua')
    expect(searchFacts('¿es legal venderlos en la tienda?', FACTS)[0]?.id).toBe('ley-mexico')
    expect(searchFacts('', FACTS)).toEqual([])
  })

  it('responde sin IA y detecta crisis', () => {
    expect(guideAnswer('¿cuánto duran los antojos?', FACTS).factIds).toContain('antojos')
    expect(guideAnswer('quiero morirme', FACTS).mode).toBe('crisis')
    expect(isCrisis('me quiero lastimar')).toBe(false)
    expect(isCrisis('quiero lastimarme')).toBe(true)
  })
})

describe('almacenamiento', () => {
  beforeEach(() => localStorage.clear())

  it('lee y escribe JSON con valor por defecto', () => {
    expect(readJSON('x', 5)).toBe(5)
    writeJSON('x', { a: 1 })
    expect(readJSON('x', null)).toEqual({ a: 1 })
    localStorage.setItem('roto', '{no-json')
    expect(readJSON('roto', 'ok')).toBe('ok')
  })

  it('no falla si el almacenamiento está lleno o bloqueado', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const store = createPersistentStore('k', 0, (r) => (typeof r === 'number' ? r : null))
    store.set(3)
    expect(store.get()).toBe(3)
    expect(store.isPersisted()).toBe(false)
    spy.mockRestore()
  })

  it('notifica a los suscriptores y valida al leer', () => {
    localStorage.setItem('k2', '"texto"')
    const store = createPersistentStore('k2', 1, (r) => (typeof r === 'number' ? r : null))
    expect(store.get()).toBe(1)
    const listener = vi.fn()
    store.subscribe(listener)
    store.set((n) => n + 1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get()).toBe(2)
  })
})

describe('cola de resultados', () => {
  const payload = (id: string) => ({
    clientId: id,
    groupCode: 'ABCD-2345',
    pre: { answers: [true, false, false, false, false], confidence: 0 },
    post: { answers: [true, true, true, true, true], confidence: 2 },
    casesCorrect: 6,
  })

  beforeEach(() => queueStore.reset())

  it('envía, conserva los pendientes ante fallas de red y descarta los rechazados', async () => {
    enqueueResult(payload('a'))
    enqueueResult(payload('a'))
    enqueueResult(payload('b'))
    enqueueResult(payload('c'))
    expect(queueStore.get().items).toHaveLength(3)

    const request = vi.fn(async (_path: string, opts?: { body?: unknown }) => {
      const id = (opts?.body as { clientId: string }).clientId
      if (id === 'b') throw new ApiError(0, 'network', 'sin red')
      if (id === 'c')
        throw new ApiError(404, 'group_not_found', 'No existe un grupo con ese código.')
      return { ok: true }
    })
    await flushQueue(request as never)
    const state = queueStore.get()
    expect(state.status.a).toEqual({ state: 'sent' })
    expect(state.status.b).toEqual({ state: 'pending' })
    expect(state.status.c).toEqual({
      state: 'rejected',
      message: 'No existe un grupo con ese código.',
    })
    expect(state.items.map((i) => i.clientId)).toEqual(['b'])
  })
})
