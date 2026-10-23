import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
  tone?: 'plain' | 'lemon' | 'mint' | 'magenta'
}

export function StatTile({ label, value, detail, icon, tone = 'plain' }: StatTileProps) {
  return (
    <div className={`stat stat--${tone}`}>
      <dt className="stat__label">
        {icon && (
          <span aria-hidden="true" className="stat__icon">
            {icon}
          </span>
        )}
        {label}
      </dt>
      <dd className="stat__value">{value}</dd>
      {detail && <dd className="stat__detail">{detail}</dd>}
    </div>
  )
}
