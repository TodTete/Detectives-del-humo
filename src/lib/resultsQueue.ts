import { useSyncExternalStore } from 'react'
import { ApiError, apiRequest } from './api'
import { createPersistentStore } from './storage'

export interface ResultPayload {
  clientId: string
  groupCode: string
  pre: { answers: boolean[]; confidence: number }
  post: { answers: boolean[]; confidence: number }
  casesCorrect: number
}

export type DeliveryStatus =
  | { state: 'pending' }
  | { state: 'sending' }
  | { state: 'sent' }
  | { state: 'rejected'; message: string }

interface QueueState {
  items: ResultPayload[]
  status: Record<string, DeliveryStatus>
}

function parseQueue(raw: unknown): QueueState | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as QueueState
  if (!Array.isArray(v.items) || typeof v.status !== 'object' || v.status === null) return null
  return v
}

export const queueStore = createPersistentStore<QueueState>(
  'ddh.queue.v1',
  { items: [], status: {} },
  parseQueue,
)

export function enqueueResult(payload: ResultPayload) {
  queueStore.set((prev) => {
    if (
      prev.items.some((i) => i.clientId === payload.clientId) ||
      prev.status[payload.clientId]?.state === 'sent'
    ) {
      return prev
    }
    return {
      items: [...prev.items, payload],
      status: { ...prev.status, [payload.clientId]: { state: 'pending' } },
    }
  })
}

function setStatus(clientId: string, status: DeliveryStatus, remove = false) {
  queueStore.set((prev) => ({
    items: remove ? prev.items.filter((i) => i.clientId !== clientId) : prev.items,
    status: { ...prev.status, [clientId]: status },
  }))
}

let flushing: Promise<void> | null = null

/** Envía los resultados pendientes. Los errores de red los dejan en cola para reintentar. */
export function flushQueue(request: typeof apiRequest = apiRequest): Promise<void> {
  if (flushing) return flushing
  flushing = (async () => {
    for (const item of [...queueStore.get().items]) {
      setStatus(item.clientId, { state: 'sending' })
      try {
        await request('/results', { method: 'POST', body: item })
        setStatus(item.clientId, { state: 'sent' }, true)
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 429
        ) {
          setStatus(item.clientId, { state: 'rejected', message: error.message }, true)
        } else {
          setStatus(item.clientId, { state: 'pending' })
        }
      }
    }
  })().finally(() => {
    flushing = null
  })
  return flushing
}

export function useDeliveryStatus(clientId: string | null): DeliveryStatus | null {
  const state = useSyncExternalStore(queueStore.subscribe, queueStore.get, queueStore.get)
  return clientId ? (state.status[clientId] ?? null) : null
}

export function startQueueSync() {
  const run = () => {
    if (navigator.onLine) void flushQueue()
  }
  window.addEventListener('online', run)
  run()
  return () => window.removeEventListener('online', run)
}
