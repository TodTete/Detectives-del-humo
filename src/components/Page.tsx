import { useEffect, type ReactNode } from 'react'

const APP_NAME = 'Detectives del Humo'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}

interface PageHeaderProps {
  title: ReactNode
  lede?: ReactNode
  /** Texto plano para el título de la pestaña. */
  documentTitle: string
  kicker?: ReactNode
  actions?: ReactNode
}

/** Encabezado de página: el h1 recibe el foco al navegar (lo anuncia el lector de pantalla). */
export function PageHeader({ title, lede, documentTitle, kicker, actions }: PageHeaderProps) {
  useDocumentTitle(documentTitle)
  return (
    <header className="page-header">
      {kicker && <p className="page-header__kicker">{kicker}</p>}
      <h1 tabIndex={-1} data-page-title>
        {title}
      </h1>
      {lede && <p className="page-header__lede">{lede}</p>}
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
