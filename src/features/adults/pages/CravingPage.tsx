import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Notice } from '../../../components/Notice'
import { PageHeader } from '../../../components/Page'
import { useToast } from '../../../components/Toast'
import { today } from '../../../lib/dates'
import { getFact } from '../../../lib/knowledge'
import { addCravingBeaten, useAdultState } from '../store'

const TOTAL = 10 * 60

const PHASES = [
  { label: 'Inhala', seconds: 4 },
  { label: 'Sostén', seconds: 4 },
  { label: 'Exhala despacio', seconds: 6 },
] as const

function useCountdown(total: number) {
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const endAt = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    endAt.current = Date.now() + left * 1000
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round(((endAt.current ?? 0) - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) setRunning(false)
    }, 250)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  return {
    left,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false)
      setLeft(total)
    },
  }
}

function Breathing() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(
      () => setPhase((p) => (p + 1) % PHASES.length),
      PHASES[phase]!.seconds * 1000,
    )
    return () => window.clearTimeout(id)
  }, [active, phase])
  const current = PHASES[phase]!
  return (
    <section className="sheet breathing" aria-labelledby="breath-title">
      <h2 id="breath-title" className="h3">
        Respira conmigo
      </h2>
      <p>Inhala 4 segundos, sostén 4 y exhala 6. Repite mientras corre el reloj.</p>
      <div
        className={`breathing__circle ${active ? `breathing__circle--${phase}` : ''}`}
        aria-hidden="true"
      >
        <span>{active ? current.label : 'Listo'}</span>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {active ? current.label : ''}
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          setPhase(0)
          setActive((a) => !a)
        }}
        aria-pressed={active}
      >
        {active ? 'Detener respiración guiada' : 'Empezar respiración guiada'}
      </Button>
    </section>
  )
}

export function CravingPage() {
  const toast = useToast()
  const { entries } = useAdultState()
  const timer = useCountdown(TOTAL)
  const minutes = Math.floor(timer.left / 60)
  const seconds = timer.left % 60
  const done = timer.left === 0
  const strategies = getFact('estrategias')
  const beatenToday = entries[today()]?.cravingsBeaten ?? 0

  return (
    <div className="page">
      <PageHeader
        documentTitle="Tengo ganas"
        title="Las ganas suben y luego bajan"
        lede="Date 10 minutos antes de decidir. Mientras tanto, respira, muévete o cambia de lugar."
      />
      <div className="craving">
        <section className="sheet timer" aria-labelledby="timer-title">
          <h2 id="timer-title" className="h3">
            Regla de los 10 minutos
          </h2>
          <p className="timer__display" role="timer" aria-live="off" aria-atomic="true">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <p className="visually-hidden" aria-live="polite">
            {done
              ? 'Pasaron los 10 minutos.'
              : timer.running && seconds === 0
                ? `Quedan ${minutes} minutos.`
                : ''}
          </p>
          <div className="row">
            {timer.running ? (
              <Button
                onClick={timer.pause}
                icon={<Pause aria-hidden="true" className="btn__icon" />}
              >
                Pausar
              </Button>
            ) : (
              <Button
                onClick={timer.start}
                disabled={done}
                icon={<Play aria-hidden="true" className="btn__icon" />}
              >
                {timer.left === TOTAL ? 'Empezar 10 minutos' : 'Continuar'}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={timer.reset}
              icon={<RotateCcw aria-hidden="true" className="btn__icon" />}
            >
              Reiniciar
            </Button>
          </div>
          {done && (
            <Notice tone="success" title="Pasaron los 10 minutos">
              ¿Cómo van las ganas? Si bajaron, regístralo como antojo superado.
            </Notice>
          )}
          <Button
            variant="magenta"
            size="l"
            icon={<ShieldCheck aria-hidden="true" className="btn__icon" />}
            onClick={() => {
              addCravingBeaten(today())
              toast.notify(`Antojo superado. Hoy llevas ${beatenToday + 1}.`)
              timer.reset()
            }}
          >
            Superé el antojo
          </Button>
        </section>
        <Breathing />
      </div>
      {strategies && (
        <section className="section" aria-labelledby="ideas-title">
          <h2 id="ideas-title" className="h3">
            Otras ideas que ayudan
          </h2>
          <ul className="ideas">
            <li>
              Mantén las manos y la boca ocupadas: chicle sin azúcar, verduras o un vaso de agua.
            </li>
            <li>Muévete un poco, aunque sea subir y bajar escaleras.</li>
            <li>Aléjate de la situación que te dio ganas: cambia de cuarto o sal a caminar.</li>
            <li>Escucha música o habla con alguien.</li>
          </ul>
          <p className="muted">Fuente: MedlinePlus, Biblioteca Nacional de Medicina de EE. UU.</p>
        </section>
      )}
    </div>
  )
}
