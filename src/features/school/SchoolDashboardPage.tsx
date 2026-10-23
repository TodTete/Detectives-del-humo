import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Download, RefreshCw, Users } from 'lucide-react'
import { BarChart } from '../../components/BarChart'
import { Button, LinkButton } from '../../components/Button'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/Page'
import { StatTile } from '../../components/StatTile'
import { ApiError, apiRequest } from '../../lib/api'
import { GROUP_CODE_REGEX, normalizeCode } from '../../lib/groupCode'
import { CONFIDENCE_OPTIONS, QUIZ } from '../kids/data/quiz'
import { DEMO, type GroupResponse } from './types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'ready'; data: GroupResponse; at: Date }

const timeFormatter = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' })
const pct = (v: number) => `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`

function toCSV(data: GroupResponse): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows: (string | number)[][] = [
    ['Escuela', data.group.schoolName],
    ['Grado y grupo', `${data.group.grade}.º ${data.group.groupLabel}`],
    ['Código', data.group.code],
    ['Participantes', data.stats.participants],
    ['Aciertos promedio antes (%)', data.stats.preScore],
    ['Aciertos promedio después (%)', data.stats.postScore],
    ['Casos resueltos a la primera (promedio de 6)', data.stats.casesAverage],
    [],
    ['Afirmación', 'Aciertos antes (%)', 'Aciertos después (%)'],
    ...QUIZ.map((q, i) => [
      q.statement,
      data.stats.perQuestion[i]?.pre ?? 0,
      data.stats.perQuestion[i]?.post ?? 0,
    ]),
    [],
    ['¿Sabría qué decir si le ofrecen?', 'Antes (personas)', 'Después (personas)'],
    ...CONFIDENCE_OPTIONS.map((o) => [
      o.label,
      data.stats.confidence.pre[o.value] ?? 0,
      data.stats.confidence.post[o.value] ?? 0,
    ]),
  ]
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

function Dashboard({
  data,
  demo,
  at,
  onRefresh,
  refreshing,
}: {
  data: GroupResponse
  demo: boolean
  at?: Date
  onRefresh?: () => void
  refreshing?: boolean
}) {
  const { group, stats } = data
  const delta = Math.round((stats.postScore - stats.preScore) * 10) / 10

  function download() {
    const blob = new Blob([toCSV(data)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados-${group.code}.csv`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <div className="page">
      <PageHeader
        documentTitle={demo ? 'Panel de ejemplo' : `Grupo ${group.code}`}
        kicker={`Código ${group.code}`}
        title={`${group.schoolName}, ${group.grade}.º ${group.groupLabel}`.trim()}
        lede={demo ? undefined : at ? `Actualizado a las ${timeFormatter.format(at)}.` : undefined}
        actions={
          <div className="row">
            {onRefresh && (
              <Button
                variant="secondary"
                onClick={onRefresh}
                loading={refreshing}
                icon={<RefreshCw aria-hidden="true" className="btn__icon" />}
              >
                Actualizar
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={download}
              disabled={stats.participants === 0}
              icon={<Download aria-hidden="true" className="btn__icon" />}
            >
              Descargar CSV
            </Button>
          </div>
        }
      />
      {demo && (
        <Notice tone="warning" title="Estos son datos de ejemplo">
          Sirven para mostrar cómo se ve el panel. No corresponden a ninguna escuela real.
        </Notice>
      )}

      {stats.participants === 0 ? (
        <div className="empty-state sheet">
          <Users aria-hidden="true" className="empty-state__icon" />
          <h2 className="h3">Todavía no hay resultados</h2>
          <p>
            Comparte el código <strong className="code">{group.code}</strong> con tu grupo. Los
            resultados aparecen aquí cuando alguien termina la misión con conexión a internet.
          </p>
        </div>
      ) : (
        <>
          <dl className="stats stats--4">
            <StatTile label="Participantes" value={stats.participants} />
            <StatTile label="Aciertos antes" value={pct(stats.preScore)} />
            <StatTile tone="mint" label="Aciertos después" value={pct(stats.postScore)} />
            <StatTile
              tone="lemon"
              label="Cambio"
              value={`${delta >= 0 ? '+' : ''}${delta.toLocaleString('es-MX')} puntos`}
              detail={`Casos resueltos a la primera: ${stats.casesAverage} de 6`}
            />
          </dl>
          <section className="section">
            <BarChart
              title="Aciertos por afirmación"
              description="Porcentaje del grupo que respondió bien cada afirmación antes y después de la misión."
              series={[
                { key: 'pre', label: 'Antes', className: 'bar--smoke hatched' },
                { key: 'post', label: 'Después', className: 'bar--magenta' },
              ]}
              groups={QUIZ.map((q, i) => ({
                label: q.statement,
                shortLabel: `Af. ${i + 1}`,
                values: {
                  pre: stats.perQuestion[i]?.pre ?? 0,
                  post: stats.perQuestion[i]?.post ?? 0,
                },
              }))}
              max={100}
              formatValue={pct}
            />
            <ol className="statements">
              {QUIZ.map((q, i) => (
                <li key={q.id}>
                  <span className="statements__tag">Af. {i + 1}</span> {q.statement}
                </li>
              ))}
            </ol>
          </section>
          <section className="section">
            <BarChart
              title="¿Sabrían qué decir si les ofrecen un vapeador?"
              description="Número de personas por respuesta, antes y después."
              series={[
                { key: 'pre', label: 'Antes', className: 'bar--smoke hatched' },
                { key: 'post', label: 'Después', className: 'bar--magenta' },
              ]}
              groups={[...CONFIDENCE_OPTIONS].reverse().map((o) => ({
                label: o.label,
                shortLabel: ['No sabría', 'Más o menos', 'Sí sabría'][o.value],
                values: {
                  pre: stats.confidence.pre[o.value] ?? 0,
                  post: stats.confidence.post[o.value] ?? 0,
                },
              }))}
              formatValue={(v) => `${v}`}
            />
          </section>
        </>
      )}
      <LinkButton
        to="/escuelas"
        variant="ghost"
        icon={<ArrowLeft aria-hidden="true" className="btn__icon" />}
      >
        Volver a escuelas
      </LinkButton>
    </div>
  )
}

export function SchoolDemoPage() {
  return <Dashboard data={DEMO} demo />
}

export function SchoolDashboardPage() {
  const params = useParams()
  const code = normalizeCode(params.code ?? '')
  const valid = GROUP_CODE_REGEX.test(code)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    apiRequest<GroupResponse>(`/groups/${code}`, { signal: controller.signal })
      .then((data) => setState({ status: 'ready', data, at: new Date() }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const notFound = error instanceof ApiError && error.status === 404
        setState({
          status: 'error',
          notFound,
          message:
            error instanceof ApiError ? error.message : 'No se pudieron cargar los resultados.',
        })
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false)
      })
    return () => controller.abort()
  }, [code, valid, attempt])

  if (!valid) {
    return (
      <div className="page page--narrow">
        <PageHeader
          documentTitle="Código inválido"
          title="Ese código no tiene el formato correcto"
          lede="Los códigos tienen 8 letras y números, por ejemplo ABCD-2345."
        />
        <LinkButton to="/escuelas" icon={<ArrowLeft aria-hidden="true" className="btn__icon" />}>
          Volver a escuelas
        </LinkButton>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="page" aria-busy="true">
        <PageHeader
          documentTitle="Cargando resultados"
          title="Cargando resultados…"
          kicker={`Código ${code}`}
        />
        <div className="skeleton-grid" aria-hidden="true">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page page--narrow">
        <PageHeader
          documentTitle="No se pudieron cargar los resultados"
          title={
            state.notFound ? 'No encontramos ese grupo' : 'No se pudieron cargar los resultados'
          }
          kicker={`Código ${code}`}
        />
        <Notice
          tone="error"
          live="alert"
          action={
            !state.notFound && (
              <Button
                variant="secondary"
                onClick={() => {
                  setState({ status: 'loading' })
                  setAttempt((n) => n + 1)
                }}
                icon={<RefreshCw aria-hidden="true" className="btn__icon" />}
              >
                Reintentar
              </Button>
            )
          }
        >
          {state.message}
        </Notice>
        <LinkButton
          to="/escuelas"
          variant="ghost"
          icon={<ArrowLeft aria-hidden="true" className="btn__icon" />}
        >
          Volver a escuelas
        </LinkButton>
      </div>
    )
  }

  return (
    <Dashboard
      data={state.data}
      demo={false}
      at={state.at}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true)
        setAttempt((n) => n + 1)
      }}
    />
  )
}
