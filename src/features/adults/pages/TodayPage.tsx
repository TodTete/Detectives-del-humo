import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarPlus,
  CircleCheck,
  Flame,
  Pencil,
  PiggyBank,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Wind,
} from 'lucide-react'
import { BarChart } from '../../../components/BarChart'
import { Button, LinkButton } from '../../../components/Button'
import { ConfirmDialog, Dialog } from '../../../components/Dialog'
import { Field } from '../../../components/Field'
import { PageHeader } from '../../../components/Page'
import { StatTile } from '../../../components/StatTile'
import { useToast } from '../../../components/Toast'
import {
  addDays,
  daysBetween,
  formatLong,
  formatMoney,
  formatShort,
  today,
} from '../../../lib/dates'
import { NumberStepper } from '../components/NumberStepper'
import { targetForDate } from '../plan'
import { PRODUCTS, type Profile } from '../schema'
import { computeStats, type Entries } from '../stats'
import { logCount, removeEntry, useAdultState } from '../store'
import { OnboardingPage } from './OnboardingPage'

function LogForm({
  profile,
  date,
  initial,
  onSaved,
  submitLabel,
}: {
  profile: Profile
  date: string
  initial: number
  onSaved: (count: number) => void
  submitLabel: string
}) {
  const [count, setCount] = useState(initial)
  const id = useId()
  const unit = PRODUCTS[profile.product]
  const target = targetForDate(profile, date)
  return (
    <form
      className="log-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        logCount(date, count)
        onSaved(count)
      }}
    >
      <label htmlFor={id} className="field__label">
        ¿{unit.howMany[0]!.toUpperCase() + unit.howMany.slice(1)} {unit.unit} usaste{' '}
        {date === today() ? 'hoy' : `el ${formatShort(date)}`}?
      </label>
      <p className="field__hint" id={`${id}-hint`}>
        Tu límite para ese día: {target} {target === 1 ? unit.unitOne : unit.unit}.
      </p>
      <NumberStepper
        id={id}
        value={count}
        onChange={setCount}
        unitLabel={unit.unitOne}
        article={unit.article}
        describedBy={`${id}-hint`}
      />
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}

function History({ profile, entries }: { profile: Profile; entries: Entries }) {
  const toast = useToast()
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newDate, setNewDate] = useState(addDays(today(), -1))
  const [dateError, setDateError] = useState<string>()
  const unit = PRODUCTS[profile.product]
  const rows = Object.entries(entries)
    .filter(([, e]) => e.count !== null)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 14)

  return (
    <section className="section" aria-labelledby="history-title">
      <div className="section__head">
        <h2 id="history-title" className="h3">
          Tus registros
        </h2>
        <Button
          variant="secondary"
          size="s"
          onClick={() => setAdding(true)}
          icon={<CalendarPlus aria-hidden="true" className="btn__icon" />}
        >
          Registrar otro día
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="empty">
          Aún no hay registros. Empieza con el de hoy: cada dato te ayuda a ver tu avance.
        </p>
      ) : (
        <ul className="history">
          {rows.map(([date, e]) => {
            const target = targetForDate(profile, date)
            const ok = (e.count ?? 0) <= target
            return (
              <li key={date} className="history__row">
                <span className="history__date">{formatLong(date)}</span>
                <span className={`history__value ${ok ? 'is-ok' : 'is-over'}`}>
                  {ok ? <CircleCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
                  {e.count} de {target} {unit.unit}
                  <span className="visually-hidden">
                    {ok ? ', dentro del límite' : ', arriba del límite'}
                  </span>
                </span>
                <span className="history__actions">
                  <Button
                    variant="ghost"
                    size="s"
                    onClick={() => setEditing(date)}
                    icon={<Pencil aria-hidden="true" className="btn__icon" />}
                  >
                    <span className="visually-hidden">Editar registro del {formatLong(date)}</span>
                    <span aria-hidden="true">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="s"
                    onClick={() => setDeleting(date)}
                    icon={<Trash2 aria-hidden="true" className="btn__icon" />}
                  >
                    <span className="visually-hidden">Borrar registro del {formatLong(date)}</span>
                    <span aria-hidden="true">Borrar</span>
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar registro">
        {editing && (
          <LogForm
            key={editing}
            profile={profile}
            date={editing}
            initial={entries[editing]?.count ?? 0}
            submitLabel="Guardar cambios"
            onSaved={() => {
              setEditing(null)
              toast.notify('Registro actualizado.')
            }}
          />
        )}
      </Dialog>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Registrar otro día">
        <div className="stack">
          <Field
            label="Fecha"
            hint={`Desde el inicio de tu plan (${formatShort(profile.startDate)}) hasta hoy.`}
            error={dateError}
          >
            {(props) => (
              <input
                {...props}
                className="input input--short"
                type="date"
                min={profile.startDate}
                max={today()}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value)
                  const v = e.target.value
                  if (!v || daysBetween(profile.startDate, v) < 0 || daysBetween(v, today()) < 0)
                    setDateError('Elige una fecha entre el inicio de tu plan y hoy.')
                  else setDateError(undefined)
                }}
              />
            )}
          </Field>
          {!dateError && newDate && (
            <LogForm
              key={newDate}
              profile={profile}
              date={newDate}
              initial={entries[newDate]?.count ?? 0}
              submitLabel="Guardar registro"
              onSaved={() => {
                setAdding(false)
                toast.notify('Registro guardado.')
              }}
            />
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="¿Borrar este registro?"
        confirmLabel="Borrar registro"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) removeEntry(deleting)
          setDeleting(null)
          toast.notify('Registro borrado.')
        }}
      >
        <p>{deleting ? `Se borrará lo que registraste el ${formatLong(deleting)}.` : ''}</p>
      </ConfirmDialog>
    </section>
  )
}

export function TodayPage() {
  const { profile, entries } = useAdultState()
  const toast = useToast()
  if (!profile) return <OnboardingPage />

  const date = today()
  const stats = computeStats(profile, entries, date)
  const unit = PRODUCTS[profile.product]
  const logged = stats.todayCount !== null
  const within = logged && (stats.todayCount ?? 0) <= stats.todayTarget

  return (
    <div className="page">
      <PageHeader
        documentTitle="Hoy"
        kicker={<span className="capitalize">{formatLong(date)}</span>}
        title={
          stats.todayTarget === 0
            ? 'Hoy tu meta es cero'
            : `Hoy tu límite es ${stats.todayTarget} ${stats.todayTarget === 1 ? unit.unitOne : unit.unit}`
        }
        lede={
          stats.daysToGoal > 0
            ? `Faltan ${stats.daysToGoal} días para tu fecha meta (${formatShort(profile.targetDate)}).`
            : 'Llegaste a tu fecha meta. Sigue registrando para cuidar lo que lograste.'
        }
      />

      <div className="today">
        <section className="sheet today__log" aria-labelledby="log-title">
          <h2 id="log-title" className="h3">
            Registro de hoy
          </h2>
          {logged && (
            <p className={`today__status ${within ? 'is-ok' : 'is-over'}`} role="status">
              {within ? <CircleCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
              {within
                ? `Vas dentro de tu límite: ${stats.todayCount} de ${stats.todayTarget}.`
                : `Hoy pasaste tu límite (${stats.todayCount} de ${stats.todayTarget}). Mañana es otro día: lo importante es seguir registrando.`}
            </p>
          )}
          <LogForm
            key={`${date}-${stats.todayCount ?? 'none'}`}
            profile={profile}
            date={date}
            initial={stats.todayCount ?? 0}
            submitLabel={logged ? 'Actualizar registro' : 'Guardar registro'}
            onSaved={(count) =>
              toast.notify(
                count <= stats.todayTarget
                  ? 'Registro guardado. ¡Vas dentro de tu límite!'
                  : 'Registro guardado.',
              )
            }
          />
          <LinkButton
            to="/adultos/antojo"
            variant="secondary"
            icon={<Wind aria-hidden="true" className="btn__icon" />}
          >
            Tengo ganas ahora
          </LinkButton>
        </section>

        <dl className="stats">
          <StatTile
            tone="lemon"
            icon={<Flame />}
            label="Racha"
            value={`${stats.streak} ${stats.streak === 1 ? 'día' : 'días'}`}
            detail="seguidos dentro de tu límite"
          />
          <StatTile
            tone="mint"
            icon={<PiggyBank />}
            label="Ahorro estimado"
            value={formatMoney(stats.moneySaved)}
            detail={`${stats.unitsAvoided} ${unit.unit} menos`}
          />
          <StatTile
            icon={<ShieldCheck />}
            label="Antojos superados"
            value={stats.cravingsBeaten}
            detail="con la herramienta de ganas"
          />
          <StatTile
            icon={<CircleCheck />}
            label="Días en meta"
            value={`${stats.daysOnTarget} de ${stats.loggedDays}`}
            detail="días registrados"
          />
        </dl>
      </div>

      {profile.reasons && (
        <blockquote className="reasons">
          <p>Tus razones: “{profile.reasons}”</p>
        </blockquote>
      )}

      <section className="section">
        <BarChart
          title="Últimos 14 días"
          description={`Lo que registraste cada día comparado con tu límite. ${stats.loggedDays === 0 ? 'Todavía no hay registros.' : ''}`}
          series={[{ key: 'count', label: `Lo que usaste (${unit.unit})`, className: 'bar--ink' }]}
          groups={stats.series.map((p) => ({
            label: formatShort(p.date),
            shortLabel: p.date.slice(8),
            values: { count: p.count },
            reference: p.target,
          }))}
          referenceLabel="Límite del día"
          formatValue={(v) => `${v}`}
        />
      </section>

      <History profile={profile} entries={entries} />
      <p className="muted">
        ¿Quieres cambiar tu meta o tu fecha? <Link to="/adultos/plan">Edita tu plan</Link>.
      </p>
    </div>
  )
}
