import { ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/Page'
import { FACTS, KNOWLEDGE_VERSION, SOURCES } from '../lib/knowledge'

export function SourcesPage() {
  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Fuentes"
        title="Fuentes de la información"
        lede="Todo lo que dice la app sale de esta guía verificada. El asistente con IA solo puede responder con estos datos."
      />
      <section aria-labelledby="facts-title" className="section">
        <h2 id="facts-title">La guía verificada</h2>
        <ul className="fact-list">
          {FACTS.map((fact) => (
            <li key={fact.id} className="fact">
              <h3>{fact.title}</h3>
              <p>{fact.text}</p>
              <p className="fact__sources">
                Fuente:{' '}
                {fact.sources
                  .map((id) => SOURCES.find((s) => s.id === id)?.publisher)
                  .filter(Boolean)
                  .join('; ')}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="sources-title" className="section">
        <h2 id="sources-title">Documentos consultados</h2>
        <ul className="source-list">
          {SOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
                <ExternalLink aria-hidden="true" className="inline-icon" />
                <span className="visually-hidden"> (se abre en otra pestaña)</span>
              </a>
              <span className="source-list__publisher">{s.publisher}</span>
            </li>
          ))}
        </ul>
        <p className="muted">
          Versión de la guía: {KNOWLEDGE_VERSION}. Recomendamos que el equipo de salud la revise
          antes de cada piloto.
        </p>
      </section>
    </div>
  )
}
