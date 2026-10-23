import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { STEP_ORDER, STEP_PATHS, canVisit, currentStep, useKidsState, type KidsStep } from './state'

const LABELS: Partial<Record<KidsStep, string>> = {
  pre: 'Antes',
  cases: 'Casos',
  response: 'Mi frase',
  post: 'Después',
  done: 'Certificado',
}

function stepForPath(pathname: string): KidsStep {
  const clean = pathname.replace(/\/$/, '')
  const found = (Object.entries(STEP_PATHS) as [KidsStep, string][]).find(
    ([, path]) => path === clean,
  )
  return found ? found[0] : 'intro'
}

export function KidsLayout() {
  const state = useKidsState()
  const { pathname } = useLocation()
  const step = stepForPath(pathname)
  const current = currentStep(state)

  if (!canVisit(state, step)) {
    return <Navigate to={STEP_PATHS[current]} replace />
  }

  const visible = STEP_ORDER.filter((s) => s !== 'intro')
  return (
    <div className="kids">
      {step !== 'intro' && (
        <nav className="tracker" aria-label="Avance de la misión">
          <ol className="tracker__list">
            {visible.map((s) => {
              const done = STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(current)
              const isHere = s === step
              return (
                <li
                  key={s}
                  className={`tracker__item ${done ? 'tracker__item--done' : ''} ${isHere ? 'tracker__item--here' : ''}`}
                  aria-current={isHere ? 'step' : undefined}
                >
                  <span className="tracker__dot" aria-hidden="true">
                    {done ? <Check /> : STEP_ORDER.indexOf(s)}
                  </span>
                  <span className="tracker__label">
                    {LABELS[s]}
                    {done && <span className="visually-hidden"> (completado)</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
      )}
      <Outlet />
    </div>
  )
}
