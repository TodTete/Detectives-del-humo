import { Phone, Siren, Stethoscope } from 'lucide-react'
import { PageHeader } from '../../../components/Page'
import { LINEA_VIDA_DISPLAY, LINEA_VIDA_TEL } from '../../../lib/knowledge'

export function HelpPage() {
  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Ayuda"
        title="No tienes que hacerlo a solas"
        lede="Pedir ayuda es parte del plan. Estas opciones son gratuitas."
      />
      <div className="help">
        <section className="help__card help__card--main" aria-labelledby="linea-title">
          <h2 id="linea-title" className="h3">
            Línea de la Vida
          </h2>
          <p>
            Orientación sobre adicciones y salud mental. Gratuita, las 24 horas, los 365 días. La
            opera la Comisión Nacional de Salud Mental y Adicciones (CONASAMA).
          </p>
          <a className="btn btn--magenta btn--l" href={`tel:${LINEA_VIDA_TEL}`}>
            <Phone aria-hidden="true" className="btn__icon" />
            <span>Llamar al {LINEA_VIDA_DISPLAY}</span>
          </a>
        </section>
        <section className="help__card" aria-labelledby="urgent-title">
          <h2 id="urgent-title" className="h3">
            <Siren aria-hidden="true" className="inline-icon" /> Si estás en peligro
          </h2>
          <p>Si tú o alguien más está en peligro inmediato, llama al 911.</p>
          <a className="btn btn--secondary btn--m" href="tel:911">
            <Phone aria-hidden="true" className="btn__icon" />
            <span>Llamar al 911</span>
          </a>
        </section>
        <section className="help__card" aria-labelledby="pro-title">
          <h2 id="pro-title" className="h3">
            <Stethoscope aria-hidden="true" className="inline-icon" /> Con un profesional de la
            salud
          </h2>
          <p>
            Si sientes que no puedes dejarlo por tu cuenta, acude a tu centro de salud. Existen
            tratamientos, como la terapia de reemplazo de nicotina, que un profesional puede
            indicarte si son adecuados para ti.
          </p>
        </section>
      </div>
      <p className="muted">
        Esta app acompaña tu proceso, pero no sustituye la atención médica ni psicológica.
      </p>
    </div>
  )
}
