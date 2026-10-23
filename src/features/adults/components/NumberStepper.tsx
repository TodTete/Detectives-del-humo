import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  id: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unitLabel: string
  /** Artículo para la unidad (un cigarro, una bolsa). */
  article?: 'un' | 'una'
  describedBy?: string
}

/** Campo numérico con botones grandes de menos y más (no depende de gestos). */
export function NumberStepper({
  id,
  value,
  onChange,
  min = 0,
  max = 200,
  unitLabel,
  article = 'una',
  describedBy,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Restar ${article} ${unitLabel}`}
      >
        <Minus aria-hidden="true" />
      </button>
      <input
        id={id}
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(value) ? value : ''}
        aria-describedby={describedBy}
        onChange={(e) => {
          const n = e.target.valueAsNumber
          onChange(Number.isNaN(n) ? min : clamp(Math.round(n)))
        }}
      />
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`Sumar ${article} ${unitLabel}`}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}
