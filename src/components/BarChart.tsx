import { useId, useLayoutEffect, useRef, useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'

export interface BarSeries {
  key: string
  label: string
  /** Clase CSS que define el color (con patrón para no depender solo del color). */
  className: string
}

export interface BarGroup {
  label: string
  shortLabel?: string
  values: Record<string, number | null>
  /** Línea de referencia opcional (por ejemplo, el límite del día). */
  reference?: number
}

interface BarChartProps {
  title: string
  description: string
  series: BarSeries[]
  groups: BarGroup[]
  max?: number
  unit?: string
  referenceLabel?: string
  formatValue?: (value: number) => string
}

/**
 * Gráfica de barras en SVG accesible: incluye un resumen textual y una tabla alternativa.
 * Las series se distinguen por color y por patrón.
 */
/** Ancho real del contenedor: el SVG se dibuja a escala 1:1 para que el texto no crezca ni se encoja. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.max(260, Math.floor(el.clientWidth)))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

export function BarChart({
  title,
  description,
  series,
  groups,
  max,
  unit = '',
  referenceLabel,
  formatValue = (v) => `${v}${unit}`,
}: BarChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const id = useId()
  const patternId = `hatch-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const allValues = groups.flatMap((g) => [
    ...Object.values(g.values).filter((v): v is number => v !== null),
    g.reference ?? 0,
  ])
  const top = Math.max(max ?? 0, ...allValues, 1)
  const [scrollRef, containerWidth] = useWidth<HTMLDivElement>(560)
  // En pantallas angostas con muchos grupos, se permite desplazar horizontalmente dentro de la gráfica.
  const width = Math.max(containerWidth, groups.length * (series.length * 14 + 10))
  const height = 220
  const padTop = 12
  const padBottom = 28
  const plotH = height - padTop - padBottom
  const groupW = width / groups.length
  const barW = Math.min(40, (groupW - 12) / series.length)
  const y = (v: number) => padTop + plotH - (v / top) * plotH

  return (
    <figure className="chart" aria-labelledby={`${id}-title`}>
      <div className="chart__head">
        <figcaption id={`${id}-title`} className="chart__title">
          {title}
        </figcaption>
        <div className="segmented" role="group" aria-label="Forma de ver los datos">
          <button
            type="button"
            className="segmented__btn"
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            <ChartColumn aria-hidden="true" /> Gráfica
          </button>
          <button
            type="button"
            className="segmented__btn"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            <Table2 aria-hidden="true" /> Tabla
          </button>
        </div>
      </div>
      <p className="chart__desc">{description}</p>
      {view === 'chart' ? (
        <>
          <div className="chart__scroll" ref={scrollRef}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width={width}
              height={height}
              className="chart__svg"
              role="img"
              aria-label={`${title}. ${description}`}
            >
              <defs>
                <pattern
                  id={patternId}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" className="chart__hatch-bg" />
                  <line x1="0" y1="0" x2="0" y2="6" className="chart__hatch-line" strokeWidth="3" />
                </pattern>
              </defs>
              {[0, 0.5, 1].map((t) => (
                <line
                  key={t}
                  x1="0"
                  x2={width}
                  y1={y(top * t)}
                  y2={y(top * t)}
                  className="chart__grid"
                />
              ))}
              {groups.map((group, gi) => {
                const x0 = gi * groupW + (groupW - barW * series.length) / 2
                return (
                  <g key={group.label}>
                    {series.map((s, si) => {
                      const v = group.values[s.key]
                      if (v === null || v === undefined) {
                        return (
                          <circle
                            key={s.key}
                            cx={x0 + si * barW + barW / 2}
                            cy={y(0) - 4}
                            r="2.5"
                            className="chart__missing"
                          />
                        )
                      }
                      const h = Math.max(2, (v / top) * plotH)
                      return (
                        <rect
                          key={s.key}
                          x={x0 + si * barW + 1}
                          y={y(0) - h}
                          width={barW - 2}
                          height={h}
                          rx="3"
                          className={`chart__bar ${s.className}`}
                          style={
                            s.className.includes('hatched')
                              ? { fill: `url(#${patternId})` }
                              : undefined
                          }
                        />
                      )
                    })}
                    {group.reference !== undefined && (
                      <line
                        x1={x0 - 4}
                        x2={x0 + barW * series.length + 4}
                        y1={y(group.reference)}
                        y2={y(group.reference)}
                        className="chart__ref"
                      />
                    )}
                    <text
                      x={gi * groupW + groupW / 2}
                      y={height - 8}
                      textAnchor="middle"
                      className="chart__axis"
                    >
                      {group.shortLabel ?? group.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <ul className="chart__legend">
            {series.map((s) => (
              <li key={s.key}>
                <span className={`chart__swatch ${s.className}`} aria-hidden="true" />
                {s.label}
              </li>
            ))}
            {referenceLabel && (
              <li>
                <span className="chart__swatch chart__swatch--ref" aria-hidden="true" />
                {referenceLabel}
              </li>
            )}
          </ul>
        </>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th scope="col"> </th>
                {series.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                  </th>
                ))}
                {referenceLabel && <th scope="col">{referenceLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.label}>
                  <th scope="row">{g.label}</th>
                  {series.map((s) => {
                    const v = g.values[s.key]
                    return (
                      <td key={s.key}>
                        {v === null || v === undefined ? 'Sin registro' : formatValue(v)}
                      </td>
                    )
                  })}
                  {referenceLabel && (
                    <td>{g.reference === undefined ? '—' : formatValue(g.reference)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  )
}
