import { useEffect, useRef, useState } from 'react'
import { CircleCheck, CircleX, ExternalLink, Search } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ChoiceGroup } from '../../../components/ChoiceGroup'
import { getSource } from '../../../lib/knowledge'
import type { DetectiveCase } from '../data/cases'
import { CaseScene } from './CaseScene'

interface CaseCardProps {
  detectiveCase: DetectiveCase
  number: number
  total: number
  /** Respuesta ya guardada (al repasar). */
  savedAnswer?: number
  onSolve: (answer: number) => void
}

export function CaseCard({ detectiveCase: c, number, total, savedAnswer, onSolve }: CaseCardProps) {
  const [selected, setSelected] = useState<number | null>(savedAnswer ?? null)
  const [revealed, setRevealed] = useState(savedAnswer !== undefined)
  const [error, setError] = useState<string>()
  const revealRef = useRef<HTMLHeadingElement>(null)
  // Solo se mueve el foco cuando la persona acaba de usar la lupa (no al repasar).
  const justRevealed = useRef(false)
  const source = getSource(c.sourceId)
  const correct = selected === c.correct

  useEffect(() => {
    if (revealed && justRevealed.current) {
      justRevealed.current = false
      revealRef.current?.focus()
    }
  }, [revealed])

  function revealTruth() {
    if (selected === null) {
      setError('Primero elige lo que crees. Luego usa la lupa para ver qué hay detrás.')
      return
    }
    justRevealed.current = true
    setRevealed(true)
    onSolve(selected)
  }

  return (
    <article className="case" aria-labelledby={`case-${c.id}`}>
      <p className="case__count">
        Caso {number} de {total}
      </p>
      <h2 id={`case-${c.id}`} className="case__title">
        {c.title}
      </h2>
      <div className={`evidence ${revealed ? 'evidence--revealed' : ''}`}>
        <span className="evidence__tape" aria-hidden="true" />
        <div className="evidence__scene" aria-hidden="true">
          <CaseScene visual={c.visual} />
          <div className="evidence__smoke" />
        </div>
        <p className="evidence__caption">{c.scene}</p>
      </div>

      <ChoiceGroup<number>
        legend={c.question}
        legendClassName="case__question"
        name={`case-${c.id}`}
        value={selected}
        disabled={revealed}
        onChange={(value) => {
          setSelected(value)
          setError(undefined)
        }}
        error={error}
        options={c.options.map((label, i) => ({ value: i, label }))}
      />

      {!revealed && (
        <Button
          variant="magenta"
          size="l"
          onClick={revealTruth}
          icon={<Search aria-hidden="true" className="btn__icon" />}
        >
          Usar la lupa
        </Button>
      )}

      {revealed && (
        <section
          className={`truth ${correct ? 'truth--right' : 'truth--wrong'}`}
          aria-labelledby={`truth-${c.id}`}
        >
          <div className="truth__lens" aria-hidden="true" />
          <div className="truth__content">
            <h3 id={`truth-${c.id}`} ref={revealRef} tabIndex={-1} className="truth__title">
              {correct ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
              {correct ? '¡Pista correcta!' : 'Casi. Mira bien la pista:'}
            </h3>
            {!correct && (
              <p className="truth__answer">
                La respuesta era: <strong>{c.options[c.correct]}</strong>
              </p>
            )}
            <p>{c.reveal}</p>
            <p className="truth__trick">
              Truco descubierto: <strong>{c.trick}</strong>
            </p>
            {source && (
              <p className="truth__source">
                Fuente:{' '}
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.publisher}
                  <ExternalLink aria-hidden="true" className="inline-icon" />
                  <span className="visually-hidden"> (se abre en otra pestaña)</span>
                </a>
              </p>
            )}
          </div>
          <span className="stamp" aria-hidden="true">
            Caso resuelto
          </span>
        </section>
      )}
    </article>
  )
}
