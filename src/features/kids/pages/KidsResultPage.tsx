import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CircleCheck,
  CircleX,
  CloudOff,
  Download,
  LoaderCircle,
  RotateCcw,
  Share2,
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { ConfirmDialog } from '../../../components/Dialog'
import { Notice } from '../../../components/Notice'
import { PageHeader } from '../../../components/Page'
import { useToast } from '../../../components/Toast'
import { flushQueue, useDeliveryStatus } from '../../../lib/resultsQueue'
import { useOnline } from '../../../lib/useOnline'
import { AVATAR_NAMES, CASES, RESPONSES } from '../data/cases'
import { CHOICE_LABELS, QUIZ, gradeQuiz } from '../data/quiz'
import { AVATAR_ICONS } from '../components/avatars'
import { canvasToBlob, drawCertificate } from '../certificate'
import {
  STEP_PATHS,
  casesCorrect,
  detectiveName,
  kidsStore,
  scoreAttempt,
  useKidsState,
} from '../state'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function DeliveryNotice({
  clientId,
  groupLabel,
}: {
  clientId: string | null
  groupLabel: string | null
}) {
  const status = useDeliveryStatus(clientId)
  const online = useOnline()
  if (!status) return null
  const group = groupLabel ? ` (${groupLabel})` : ''
  switch (status.state) {
    case 'sent':
      return (
        <Notice tone="success" live="status" title={`Tus resultados llegaron a tu grupo${group}.`}>
          Se enviaron sin tu nombre.
        </Notice>
      )
    case 'sending':
      return (
        <p className="inline-status" role="status">
          <LoaderCircle className="spin" aria-hidden="true" /> Enviando tus resultados al grupo…
        </p>
      )
    case 'rejected':
      return (
        <Notice tone="error" live="alert" title="No se pudieron enviar tus resultados al grupo">
          {status.message} Tu certificado sigue siendo tuyo.
        </Notice>
      )
    case 'pending':
      return (
        <Notice
          tone="warning"
          live="status"
          title={
            online
              ? 'Tus resultados están pendientes de enviar'
              : 'Se enviarán cuando haya internet'
          }
          action={
            online ? (
              <Button size="s" variant="secondary" onClick={() => void flushQueue()}>
                Reintentar envío
              </Button>
            ) : undefined
          }
        >
          {online ? (
            'El servidor no respondió.'
          ) : (
            <span className="row-inline">
              <CloudOff aria-hidden="true" className="inline-icon" /> Quedaron guardados en este
              dispositivo.
            </span>
          )}
        </Notice>
      )
  }
}

export function KidsResultPage() {
  const state = useKidsState()
  const navigate = useNavigate()
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const [imageError, setImageError] = useState<string>()
  const [confirmReset, setConfirmReset] = useState(false)

  const name = detectiveName(state, AVATAR_NAMES)
  const pre = scoreAttempt(state.pre)
  const post = scoreAttempt(state.post)
  const solved = CASES.filter((c) => state.caseAnswers[c.id] !== undefined)
  const phrase = RESPONSES.find((r) => r.id === state.response)?.text ?? ''
  const postGrades = state.post ? gradeQuiz(state.post.choices) : []
  const Icon = state.avatar ? AVATAR_ICONS[state.avatar] : null
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator

  async function buildImage() {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('Canvas no disponible')
    await drawCertificate(canvas, {
      name,
      tricks: solved.map((c) => c.trick),
      phrase,
      date: dateFormatter.format(new Date()),
    })
    return canvasToBlob(canvas)
  }

  async function download() {
    setBusy('download')
    setImageError(undefined)
    try {
      const blob = await buildImage()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'certificado-detective-del-humo.png'
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      toast.notify('Certificado descargado.')
    } catch {
      setImageError(
        'No se pudo crear la imagen del certificado en este navegador. Puedes tomar una captura de pantalla.',
      )
    } finally {
      setBusy(null)
    }
  }

  async function share() {
    setBusy('share')
    setImageError(undefined)
    try {
      const blob = await buildImage()
      const file = new File([blob], 'certificado-detective-del-humo.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi certificado de detective',
          text: 'Descubrí los trucos detrás del humo.',
        })
      } else {
        await download()
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setImageError(
          'No se pudo compartir desde este navegador. Descarga la imagen y compártela desde tu galería.',
        )
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        documentTitle="Tu certificado"
        title="¡Misión cumplida!"
        lede="Ya conoces los trucos que usan para que el humo parezca inofensivo."
      />

      <div className="result">
        <section className="certificate" aria-labelledby="cert-title">
          <p className="certificate__brand">Detectives del Humo</p>
          <h2 id="cert-title" className="certificate__title">
            Certificado de detective
          </h2>
          <p className="certificate__name">
            {Icon && <Icon aria-hidden="true" />}
            <span className="marker">{name}</span>
          </p>
          <p>
            Descubrió {solved.length} de {CASES.length} trucos detrás del humo:
          </p>
          <ul className="certificate__tricks">
            {solved.map((c) => (
              <li key={c.id}>
                <CircleCheck aria-hidden="true" />
                {c.trick}
              </li>
            ))}
          </ul>
          <p className="certificate__phrase">
            Mi frase detective: <strong>“{phrase}”</strong>
          </p>
          <span className="stamp stamp--static" aria-hidden="true">
            Caso resuelto
          </span>
        </section>

        <div className="result__side stack">
          <section className="sheet" aria-labelledby="score-title">
            <h2 id="score-title" className="h3">
              Lo que descubriste
            </h2>
            <dl className="compare">
              <div>
                <dt>Antes</dt>
                <dd>
                  {pre} de {QUIZ.length}
                </dd>
              </div>
              <div className="compare__after">
                <dt>Después</dt>
                <dd>
                  {post} de {QUIZ.length}
                </dd>
              </div>
            </dl>
            <p>
              Resolviste {casesCorrect(state)} de {CASES.length} casos a la primera.
            </p>
          </section>

          <DeliveryNotice
            clientId={state.groupCode ? state.clientId : null}
            groupLabel={state.groupLabel}
          />

          <div className="stack-s">
            <Button
              size="l"
              onClick={() => void download()}
              loading={busy === 'download'}
              icon={<Download aria-hidden="true" className="btn__icon" />}
            >
              Descargar certificado
            </Button>
            {canShare && (
              <Button
                variant="secondary"
                onClick={() => void share()}
                loading={busy === 'share'}
                icon={<Share2 aria-hidden="true" className="btn__icon" />}
              >
                Compartir
              </Button>
            )}
            {imageError && (
              <Notice tone="error" live="alert">
                {imageError}
              </Notice>
            )}
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="review-title">
        <h2 id="review-title">Repasa las respuestas</h2>
        <ol className="review">
          {QUIZ.map((q, i) => {
            const ok = postGrades[i]
            const choice = state.post?.choices[i]
            return (
              <li
                key={q.id}
                className={`review__item ${ok ? 'review__item--ok' : 'review__item--no'}`}
              >
                <p className="review__statement">{q.statement}</p>
                <p className="review__mine">
                  {ok ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
                  <span>
                    Tu respuesta: {choice ? CHOICE_LABELS[choice] : '—'}.{' '}
                    {ok ? 'Correcta.' : 'Incorrecta.'}
                  </span>
                </p>
                <p>{q.explanation}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="section next-steps" aria-labelledby="next-title">
        <h2 id="next-title">¿Y ahora?</h2>
        <p>
          Cuéntale a alguien de tu casa uno de los trucos que descubriste. Si alguien te ofrece un
          vapeador, usa tu frase y busca a un adulto de confianza.
        </p>
        <div className="row">
          <Button
            variant="secondary"
            onClick={() => navigate(STEP_PATHS.cases)}
            icon={<BookOpen aria-hidden="true" className="btn__icon" />}
          >
            Repasar los casos
          </Button>
          <Button
            variant="ghost"
            onClick={() => setConfirmReset(true)}
            icon={<RotateCcw aria-hidden="true" className="btn__icon" />}
          >
            Dejar listo para otra persona
          </Button>
        </div>
        <p className="muted">
          ¿Quieres saber de dónde salen los datos? <Link to="/fuentes">Mira las fuentes</Link>.
        </p>
      </section>

      <canvas ref={canvasRef} className="visually-hidden" aria-hidden="true" />

      <ConfirmDialog
        open={confirmReset}
        title="¿Dejar la app lista para otra persona?"
        confirmLabel="Sí, borrar mi misión"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          kidsStore.reset()
          setConfirmReset(false)
          navigate(STEP_PATHS.intro)
        }}
      >
        <p>
          Se borrará tu misión de este dispositivo. Si quieres conservar tu certificado, descárgalo
          antes.
        </p>
      </ConfirmDialog>
    </div>
  )
}
