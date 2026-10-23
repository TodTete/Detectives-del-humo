import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button, LinkButton } from './Button'
import { useDocumentTitle } from './Page'

/** Se muestra si una sección no pudo cargarse (por ejemplo, sin conexión la primera vez). */
export function RouteError() {
  const error = useRouteError()
  useDocumentTitle('Algo salió mal')
  const isChunkError =
    error instanceof Error &&
    /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(
      error.message,
    )
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main id="contenido" className="page page--narrow" tabIndex={-1}>
      <h1 tabIndex={-1} data-page-title>
        {isChunkError
          ? 'No se pudo cargar esta sección'
          : notFound
            ? 'Página no encontrada'
            : 'Algo salió mal'}
      </h1>
      <p className="page-header__lede">
        {isChunkError
          ? 'Parece que no hay conexión y esta parte de la app todavía no se había guardado en el dispositivo. Conéctate a internet e inténtalo de nuevo.'
          : 'Ocurrió un error inesperado. Recarga la página; tus datos guardados en este dispositivo no se pierden.'}
      </p>
      <div className="row">
        <Button
          onClick={() => window.location.reload()}
          icon={<RefreshCw aria-hidden="true" className="btn__icon" />}
        >
          Recargar
        </Button>
        <LinkButton to="/" variant="secondary" reloadDocument>
          Ir al inicio
        </LinkButton>
      </div>
    </main>
  )
}
