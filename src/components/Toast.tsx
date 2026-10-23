import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CircleCheck, Info, X } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'info'
}

interface ToastApi {
  notify: (message: string, tone?: ToastItem['tone']) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Avisos breves y no intrusivos. Los mensajes críticos se muestran en la página, no aquí. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback(
    (id: number) => setItems((prev) => prev.filter((t) => t.id !== id)),
    [],
  )

  const notify = useCallback(
    (message: string, tone: ToastItem['tone'] = 'success') => {
      const id = nextId.current++
      setItems((prev) => [...prev.slice(-2), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === 'success' ? (
              <CircleCheck aria-hidden="true" className="toast__icon" />
            ) : (
              <Info aria-hidden="true" className="toast__icon" />
            )}
            <span>{t.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar aviso"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
