import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Download, Pencil, Target, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ConfirmDialog } from '../../../components/Dialog'
import { PageHeader } from '../../../components/Page'
import { useToast } from '../../../components/Toast'
import { daysBetween, formatShort, today } from '../../../lib/dates'
import { ProfileForm } from '../components/ProfileForm'
import { buildWeeks, finalTarget } from '../plan'
import { PRODUCTS, TRIGGERS } from '../schema'
import { adultStore, resetAdultData, saveProfile, useAdultState } from '../store'

export function PlanPage() {
  const { profile } = useAdultState()
  const navigate = useNavigate()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!profile) return <Navigate to="/adultos" replace />

  const unit = PRODUCTS[profile.product]
  const weeks = buildWeeks(profile)
  const now = today()
  const final = finalTarget(profile)

  function exportData() {
    const blob = new Blob([JSON.stringify(adultStore.get(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mi-plan-detectives-del-humo-${now}.json`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  if (editing) {
    return (
      <div className="page page--narrow">
        <PageHeader
          documentTitle="Editar mi plan"
          title="Editar mi plan"
          lede="Tus registros se conservan. El plan se recalcula desde el día en que empezaste."
        />
        <ProfileForm
          defaultValues={profile}
          submitLabel="Guardar cambios"
          onSubmit={(values) => {
            saveProfile(values, true)
            setEditing(false)
            toast.notify('Plan actualizado.')
          }}
        />
        <Button variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        documentTitle="Mi plan"
        title={profile.goal === 'dejar' ? 'Mi plan para dejarlo' : 'Mi plan para reducir'}
        lede={`De ${profile.perDay} a ${final} ${unit.unit} al día para el ${formatShort(profile.targetDate)}. Bajamos un poco cada semana.`}
        actions={
          <Button
            variant="secondary"
            onClick={() => setEditing(true)}
            icon={<Pencil aria-hidden="true" className="btn__icon" />}
          >
            Editar mi plan
          </Button>
        }
      />

      <ol className="weeks">
        {weeks.map((w) => {
          const isCurrent = daysBetween(w.start, now) >= 0 && daysBetween(now, w.end) >= 0
          const isPast = daysBetween(w.end, now) > 0
          return (
            <li
              key={w.index}
              className={`week ${isCurrent ? 'week--current' : ''} ${isPast ? 'week--past' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="week__head">
                <h2 className="week__title">
                  Semana {w.index + 1}
                  {isCurrent && <span className="pill pill--lemon">Esta semana</span>}
                </h2>
                <p className="week__dates">
                  {formatShort(w.start)} al {formatShort(w.end)}
                </p>
              </div>
              <p className="week__target">
                <Target aria-hidden="true" />
                Límite diario:{' '}
                <strong>
                  {w.dailyTarget === 0
                    ? 'cero'
                    : `${w.dailyTarget} ${w.dailyTarget === 1 ? unit.unitOne : unit.unit}`}
                </strong>
              </p>
              <ul className="week__tips">
                {w.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      <section className="section sheet" aria-labelledby="about-title">
        <h2 id="about-title" className="h3">
          Lo que nos contaste
        </h2>
        <dl className="details">
          <div>
            <dt>Consumes</dt>
            <dd>{unit.label}</dd>
          </div>
          <div>
            <dt>Momentos con más ganas</dt>
            <dd>{profile.triggers.map((t) => TRIGGERS[t]).join(', ')}</dd>
          </div>
          <div>
            <dt>Gasto semanal</dt>
            <dd>${profile.weeklySpend.toLocaleString('es-MX')}</dd>
          </div>
          {profile.reasons && (
            <div>
              <dt>Tus razones</dt>
              <dd>{profile.reasons}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="section" aria-labelledby="data-title">
        <h2 id="data-title" className="h3">
          Tus datos
        </h2>
        <p>
          Todo se guarda solo en este dispositivo. Puedes descargar una copia o borrarlo por
          completo.
        </p>
        <div className="row">
          <Button
            variant="secondary"
            onClick={exportData}
            icon={<Download aria-hidden="true" className="btn__icon" />}
          >
            Descargar mis datos
          </Button>
          <Button
            variant="danger"
            onClick={() => setConfirmDelete(true)}
            icon={<Trash2 aria-hidden="true" className="btn__icon" />}
          >
            Borrar mi plan y registros
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar tu plan y tus registros?"
        confirmLabel="Borrar todo"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          resetAdultData()
          setConfirmDelete(false)
          toast.notify('Se borraron tu plan y tus registros.', 'info')
          navigate('/adultos')
        }}
      >
        <p>
          Esta acción no se puede deshacer. Si quieres conservar una copia, descarga tus datos
          antes.
        </p>
      </ConfirmDialog>
    </div>
  )
}
