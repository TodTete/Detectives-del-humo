import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '../../../components/Button'
import { PageHeader } from '../../../components/Page'
import { CASES } from '../data/cases'
import { CaseCard } from '../components/CaseCard'
import { STEP_PATHS, kidsStore, useKidsState } from '../state'

function firstUnsolved(answers: Record<string, number>): number {
  const idx = CASES.findIndex((c) => answers[c.id] === undefined)
  return idx === -1 ? 0 : idx
}

export function KidsCasesPage() {
  const navigate = useNavigate()
  const state = useKidsState()
  // Si ya resolvió todos, la página funciona como repaso desde el primer caso.
  const [reviewing] = useState(() =>
    CASES.every((c) => kidsStore.get().caseAnswers[c.id] !== undefined),
  )
  const [index, setIndex] = useState(() => firstUnsolved(kidsStore.get().caseAnswers))
  const current = CASES[index]!
  const solved = state.caseAnswers[current.id] !== undefined
  const isLast = index === CASES.length - 1

  function finish() {
    navigate(state.post ? STEP_PATHS.done : STEP_PATHS.response)
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle={`Caso ${index + 1} de ${CASES.length}`}
        title={reviewing ? 'Repaso de los casos' : 'Los casos del humo'}
        lede="Observa la evidencia, elige lo que crees y usa la lupa para ver lo que hay detrás."
      />
      <CaseCard
        key={current.id}
        detectiveCase={current}
        number={index + 1}
        total={CASES.length}
        savedAnswer={state.caseAnswers[current.id]}
        onSolve={(answer) =>
          kidsStore.set((prev) => ({
            ...prev,
            caseAnswers: { ...prev.caseAnswers, [current.id]: answer },
          }))
        }
      />
      <div className="case__next">
        {reviewing && index > 0 && (
          <Button
            variant="ghost"
            onClick={() => setIndex((i) => i - 1)}
            icon={<ArrowLeft aria-hidden="true" className="btn__icon" />}
          >
            Caso anterior
          </Button>
        )}
        {solved &&
          (isLast ? (
            <Button
              size="l"
              onClick={finish}
              iconAfter={<ArrowRight aria-hidden="true" className="btn__icon" />}
            >
              {state.post ? 'Volver a mi certificado' : 'Elegir mi frase detective'}
            </Button>
          ) : (
            <Button
              size="l"
              onClick={() => setIndex((i) => i + 1)}
              iconAfter={<ArrowRight aria-hidden="true" className="btn__icon" />}
            >
              Siguiente caso
            </Button>
          ))}
      </div>
    </div>
  )
}
