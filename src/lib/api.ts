export class ApiError extends Error {
  status: number
  code: string
  issues: { path: string; message: string }[]
  constructor(
    status: number,
    code: string,
    message: string,
    issues: { path: string; message: string }[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.issues = issues
  }
}

export const OFFLINE_MESSAGE = 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.'

/** Llama a la API con tiempo límite y errores comprensibles en español. */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST'
    body?: unknown
    timeoutMs?: number
    signal?: AbortSignal
  } = {},
): Promise<T> {
  const { method = 'GET', body, timeoutMs = 15000, signal } = options
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new DOMException('timeout', 'TimeoutError')),
    timeoutMs,
  )
  signal?.addEventListener('abort', () => controller.abort(signal.reason))
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    if (controller.signal.aborted) {
      throw new ApiError(
        0,
        'timeout',
        'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
      )
    }
    throw new ApiError(
      0,
      'network',
      navigator.onLine
        ? 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.'
        : OFFLINE_MESSAGE,
    )
  } finally {
    clearTimeout(timer)
  }

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(
        response.status,
        'bad_response',
        'El servidor respondió algo inesperado. Inténtalo más tarde.',
      )
    }
  }
  if (!response.ok) {
    const payload = (data ?? {}) as {
      error?: string
      message?: string
      issues?: { path: string; message: string }[]
    }
    throw new ApiError(
      response.status,
      payload.error ?? 'http_error',
      payload.message ?? 'Ocurrió un error. Inténtalo de nuevo.',
      payload.issues ?? [],
    )
  }
  return data as T
}
