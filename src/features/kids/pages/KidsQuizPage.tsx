import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ChoiceGroup } from '../../../components/ChoiceGroup'
import { PageHeader } from '../../../components/Page'
import { enqueueResult, flushQueue } from '../../../lib/resultsQueue'
import {
  CHOICE_LABELS,
  CONFIDENCE_OPTIONS,
  CONFIDENCE_QUESTION,
  QUIZ,
  gradeQuiz,
  type QuizChoice,
} from '../data/quiz'
import { STEP_PATHS, casesCorrect, kidsStore, useKidsState } from '../state'

interface KidsQuizPageProps {
  mode: 'pre' | 'post'
}

const TOTAL = QUIZ.length + 1

export function KidsQuizPage({ mode }: KidsQuizPageProps) {
  const navigate = useNavigate()
  const state = useKidsState()
  const saved = mode === 'pre' ? state.pre : state.post
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<(QuizChoice | null)[]>(
    () => saved?.choices ?? QUIZ.map(() => null),
  )
  const [confidence, setConfidence] = useState<0 | 1 | 2 | null>(saved?.confidence ?? null)
  const [error, setError] = useState<string | undefined>()
  const questionRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Al cambiar de pregunta, el foco va a la nueva pregunta para lectores de pantalla y teclado.
    questionRef.current?.querySelector<HTMLElement>('legend [tabindex="-1"]')?.focus()
  }, [index])

  const isConfidenceStep = index === QUIZ.length
  const question = QUIZ[index]

  function next() {
    if (isConfidenceStep) {
      if (confidence === null) {
        setError('Elige una opción para terminar.')
        return
      }
      const attempt = { choices: choices as QuizChoice[], confidence }
      if (mode === 'pre') {
        kidsStore.set((prev) => ({ ...prev, pre: attempt }))
        navigate(STEP_PATHS.cases)
      } else {
        kidsStore.set((prev) => ({ ...prev, post: attempt }))
        const s = kidsStore.get()
        if (s.groupCode && s.clientId && s.pre) {
          enqueueResult({
            clientId: s.clientId,
            groupCode: s.groupCode,
            pre: { answers: gradeQuiz(s.pre.choices), confidence: s.pre.confidence },
            post: { answers: gradeQuiz(attempt.choices), confidence: attempt.confidence },
            casesCorrect: casesCorrect(s),
          })
          void flushQueue()
        }
        navigate(STEP_PATHS.done)
      }
      return
    }
    if (!choices[index]) {
      setError('Elige una respuesta. Si no estás seguro, elige “No sé”.')
      return
    }
    setError(undefined)
    setIndex((i) => i + 1)
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle={mode === 'pre' ? 'Antes de empezar' : 'Después de la misión'}
        title={
          mode === 'pre'
            ? 'Antes de empezar: ¿qué sabes?'
            : 'Después de la misión: ¿qué descubriste?'
        }
        lede={
          mode === 'pre'
            ? 'Responde lo que creas. No es examen y no pasa nada si no sabes: al final verás cuánto descubriste.'
            : 'Son las mismas preguntas del principio. Ahora tienes pistas nuevas.'
        }
      />
      <div className="sheet quiz">
        <div className="quiz__progress">
          <label htmlFor="quiz-progress">
            Pregunta {index + 1} de {TOTAL}
          </label>
          <progress id="quiz-progress" max={TOTAL} value={index + 1} />
        </div>
        <div ref={questionRef} key={index} className="quiz__question fade-in">
          {question ? (
            <ChoiceGroup<QuizChoice>
              legend={<span tabIndex={-1}>{question.statement}</span>}
              legendClassName="quiz__statement"
              name={`q-${question.id}`}
              layout="row"
              value={choices[index]}
              onChange={(value) => {
                setChoices((prev) => prev.map((c, i) => (i === index ? value : c)))
                setError(undefined)
              }}
              error={error}
              options={(['true', 'false', 'unknown'] as QuizChoice[]).map((value) => ({
                value,
                label: CHOICE_LABELS[value],
              }))}
            />
          ) : (
            <ChoiceGroup<0 | 1 | 2>
              legend={<span tabIndex={-1}>{CONFIDENCE_QUESTION}</span>}
              legendClassName="quiz__statement"
              name="confidence"
              value={confidence}
              onChange={(value) => {
                setConfidence(value)
                setError(undefined)
              }}
              error={error}
              options={CONFIDENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          )}
        </div>
        <div className="quiz__nav">
          <Button
            variant="ghost"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            icon={<ArrowLeft aria-hidden="true" className="btn__icon" />}
          >
            Anterior
          </Button>
          <Button
            variant={isConfidenceStep ? 'magenta' : 'primary'}
            onClick={next}
            iconAfter={
              isConfidenceStep ? (
                <Check aria-hidden="true" className="btn__icon" />
              ) : (
                <ArrowRight aria-hidden="true" className="btn__icon" />
              )
            }
          >
            {isConfidenceStep
              ? mode === 'pre'
                ? 'Ir a los casos'
                : 'Ver mi certificado'
              : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
