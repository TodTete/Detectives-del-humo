import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: (props: {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
  }) => ReactNode
  className?: string
  /** Id opcional del control (para enfocarlo desde fuera). */
  id?: string
}

/** Campo con etiqueta, ayuda y error asociados de forma accesible. */
export function Field({ label, hint, error, children, className, id: providedId }: FieldProps) {
  const autoId = useId()
  const id = providedId ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className ?? ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error && <FieldError id={errorId!}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p className="field__error" id={id}>
      <span aria-hidden="true" className="field__error-mark">
        !
      </span>
      {children}
    </p>
  )
}
