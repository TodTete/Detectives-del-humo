import type { ReactNode } from 'react'
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'

type Tone = 'info' | 'success' | 'warning' | 'error'

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX }

interface NoticeProps {
  tone?: Tone
  title?: string
  children?: ReactNode
  /** alert = se anuncia de inmediato; status = se anuncia de forma educada. */
  live?: 'alert' | 'status' | 'off'
  action?: ReactNode
  className?: string
}

export function Notice({
  tone = 'info',
  title,
  children,
  live = 'off',
  action,
  className,
}: NoticeProps) {
  const Icon = ICONS[tone]
  const role = live === 'alert' ? 'alert' : live === 'status' ? 'status' : undefined
  return (
    <div className={`notice notice--${tone} ${className ?? ''}`} role={role}>
      <Icon className="notice__icon" aria-hidden="true" />
      <div className="notice__body">
        {title && <p className="notice__title">{title}</p>}
        {children && <div className="notice__text">{children}</div>}
        {action && <div className="notice__action">{action}</div>}
      </div>
    </div>
  )
}
