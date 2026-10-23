import { useRef, useState, type FormEvent } from 'react'
import { BookOpen, CloudOff, ExternalLink, LifeBuoy, Send, Sparkles } from 'lucide-react'
import { guideAnswer } from '../../../../shared/guide.js'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import { Notice } from '../../../components/Notice'
import { PageHeader } from '../../../components/Page'
import { ApiError, apiRequest } from '../../../lib/api'
import { FACTS, sourcesForFacts } from '../../../lib/knowledge'
import { useOnline } from '../../../lib/useOnline'

interface Answer {
  question: string
  answer: string
  factIds: string[]
  mode: 'ai' | 'guide' | 'crisis'
  offline?: boolean
  notice?: string
}

const SUGGESTIONS = [
  '¿Cuánto duran los antojos?',
  '¿Qué hago cuando me dan ganas?',
  '¿El vapor es solo agua?',
  '¿Las bolsas de nicotina también son adictivas?',
]

const MODE_LABEL: Record<Answer['mode'], { text: string; icon: typeof Sparkles }> = {
  ai: { text: 'Respuesta con IA basada en la guía verificada', icon: Sparkles },
  guide: { text: 'Respuesta de la guía verificada', icon: BookOpen },
  crisis: { text: 'Apoyo inmediato', icon: LifeBuoy },
}

export function AskPage() {
  const online = useOnline()
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const resultRef = useRef<HTMLHeadingElement>(null)

  async function ask(q: string) {
    const text = q.trim()
    if (text.length < 3) {
      setError('Escribe una pregunta un poco más larga.')
      return
    }
    if (text.length > 500) {
      setError('La pregunta admite hasta 500 caracteres.')
      return
    }
    setError(undefined)
    setLoading(true)
    let result: Answer
    if (!online) {
      result = { question: text, ...guideAnswer(text, FACTS), offline: true }
    } else {
      try {
        const data = await apiRequest<Omit<Answer, 'question'>>('/ask', {
          method: 'POST',
          body: { question: text },
          timeoutMs: 25000,
        })
        result = { question: text, ...data }
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          setError(err.issues[0]?.message ?? err.message)
          setLoading(false)
          return
        }
        // Sin servidor o con error: se responde con la guía local para no dejar a la persona sin respuesta.
        result = {
          question: text,
          ...guideAnswer(text, FACTS),
          notice:
            err instanceof ApiError && err.status === 429
              ? err.message
              : 'No pudimos conectar con el asistente; te mostramos la guía verificada.',
        }
      }
    }
    setAnswers((prev) => [result, ...prev].slice(0, 5))
    setQuestion('')
    setLoading(false)
    requestAnimationFrame(() => resultRef.current?.focus())
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Preguntar"
        title="Pregunta lo que quieras saber"
        lede="Las respuestas salen solo de la guía verificada de la app. No sustituyen la consulta con un profesional de la salud."
      />

      {!online && (
        <Notice tone="warning" title="Estás sin conexión">
          <span className="row-inline">
            <CloudOff aria-hidden="true" className="inline-icon" /> Responderemos con la guía
            guardada en este dispositivo, sin IA.
          </span>
        </Notice>
      )}

      <form
        className="sheet stack"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!loading) void ask(question)
        }}
        noValidate
      >
        <Field
          label="Tu pregunta"
          hint="No escribas tu nombre ni datos personales. Las preguntas no se guardan."
          error={error}
        >
          {(props) => (
            <textarea
              {...props}
              className="input textarea"
              rows={3}
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (!loading) void ask(question)
                }
              }}
            />
          )}
        </Field>
        <div className="chips" role="group" aria-label="Preguntas sugeridas">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => void ask(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
        <Button
          type="submit"
          loading={loading}
          icon={<Send aria-hidden="true" className="btn__icon" />}
        >
          {loading ? 'Buscando la respuesta…' : 'Preguntar'}
        </Button>
      </form>

      <section className="answers" aria-labelledby="answers-title" aria-busy={loading}>
        <h2 id="answers-title" className="visually-hidden">
          Respuestas
        </h2>
        {answers.length === 0 && !loading && (
          <p className="empty">
            Tus respuestas aparecerán aquí. Prueba con una de las preguntas sugeridas.
          </p>
        )}
        {answers.map((a, i) => {
          const label = MODE_LABEL[a.mode]
          const Icon = label.icon
          const sources = sourcesForFacts(a.factIds)
          return (
            <article key={`${a.question}-${i}`} className={`answer answer--${a.mode}`}>
              <h3 className="answer__q" ref={i === 0 ? resultRef : undefined} tabIndex={-1}>
                {a.question}
              </h3>
              <p className="answer__mode">
                <Icon aria-hidden="true" className="inline-icon" />
                {label.text}
                {a.offline ? ' (sin conexión)' : ''}
              </p>
              {a.notice && <p className="answer__notice">{a.notice}</p>}
              {a.answer.split('\n\n').map((para, j) => (
                <p key={j}>{para}</p>
              ))}
              {a.mode === 'crisis' && (
                <a className="btn btn--magenta btn--m" href="tel:8009112000">
                  <LifeBuoy aria-hidden="true" className="btn__icon" />
                  <span>Llamar a la Línea de la Vida</span>
                </a>
              )}
              {sources.length > 0 && (
                <p className="answer__sources">
                  Fuentes:{' '}
                  {sources.map((s, k) => (
                    <span key={s.id}>
                      {k > 0 && '; '}
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.publisher}
                        <ExternalLink aria-hidden="true" className="inline-icon" />
                        <span className="visually-hidden"> (se abre en otra pestaña)</span>
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
