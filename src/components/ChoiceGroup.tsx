import { useId, type ReactNode } from 'react'
import { FieldError } from './Field'

export interface Choice<T extends string | number> {
  value: T
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
}

interface ChoiceGroupProps<T extends string | number> {
  legend: ReactNode
  hint?: ReactNode
  name: string
  options: Choice<T>[]
  value: T | null | undefined
  onChange: (value: T) => void
  error?: string
  layout?: 'stack' | 'grid' | 'row'
  legendClassName?: string
  disabled?: boolean
}

/** Grupo de opciones tipo radio, con tarjetas grandes y navegación con flechas nativa. */
export function ChoiceGroup<T extends string | number>({
  legend,
  hint,
  name,
  options,
  value,
  onChange,
  error,
  layout = 'stack',
  legendClassName,
  disabled,
}: ChoiceGroupProps<T>) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <fieldset
      className={`choices choices--${layout} ${error ? 'choices--error' : ''}`}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      disabled={disabled}
    >
      <legend className={legendClassName ?? 'field__label'}>{legend}</legend>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className="choices__list">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          const checked = value === option.value
          return (
            <label
              key={String(option.value)}
              className={`choice ${checked ? 'choice--checked' : ''}`}
              htmlFor={optionId}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                className="choice__input"
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <span className="choice__mark" aria-hidden="true" />
              {option.icon && (
                <span className="choice__icon" aria-hidden="true">
                  {option.icon}
                </span>
              )}
              <span className="choice__text">
                <span className="choice__label">{option.label}</span>
                {option.description && <span className="choice__desc">{option.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  )
}
