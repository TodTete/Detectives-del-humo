import { House } from 'lucide-react'
import { LinkButton } from '../components/Button'
import { PageHeader } from '../components/Page'

export function NotFoundPage() {
  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Página no encontrada"
        title="Esta pista no lleva a ningún lado"
        lede="La página que buscas no existe o cambió de lugar."
        actions={
          <LinkButton to="/" icon={<House aria-hidden="true" className="btn__icon" />}>
            Ir al inicio
          </LinkButton>
        }
      />
    </div>
  )
}
