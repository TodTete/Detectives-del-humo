import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, RotateCcw, Search } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ChoiceGroup } from '../../../components/ChoiceGroup'
import { ConfirmDialog } from '../../../components/Dialog'
import { Field } from '../../../components/Field'
import { Notice } from '../../../components/Notice'
import { PageHeader } from '../../../components/Page'
import { ApiError, apiRequest } from '../../../lib/api'
import { GROUP_CODE_REGEX as CODE_REGEX, normalizeCode } from '../../../lib/groupCode'
import { randomId } from '../../../lib/id'
import { useOnline } from '../../../lib/useOnline'
import { AVATARS, AVATAR_NAMES, type AvatarId } from '../data/cases'
import { AVATAR_ICONS } from '../components/avatars'
import { STEP_PATHS, currentStep, initialKidsState, kidsStore, useKidsState } from '../state'

interface GroupResponse {
  group: { schoolName: string; grade: string; groupLabel: string }
}

export function KidsIntroPage() {
  const state = useKidsState()
  const navigate = useNavigate()
  const online = useOnline()
  const [avatar, setAvatar] = useState<AvatarId | null>(null)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<{ avatar?: string; code?: string }>({})
  const [checking, setChecking] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const step = currentStep(state)
  const inProgress = step !== 'intro'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (checking) return
    const nextErrors: typeof errors = {}
    if (!avatar) nextErrors.avatar = 'Elige un animal para tu placa de detective.'
    const normalized = normalizeCode(code.trim())
    if (normalized && !CODE_REGEX.test(normalized)) {
      nextErrors.code =
        'El código tiene 8 letras y números, por ejemplo ABCD-2345. Revisa que esté completo.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      document
        .querySelector<HTMLElement>(nextErrors.avatar ? '.choices input' : '#codigo-grupo')
        ?.focus()
      return
    }

    let groupLabel: string | null = null
    if (normalized && online) {
      setChecking(true)
      try {
        const data = await apiRequest<GroupResponse>(`/groups/${normalized}`)
        groupLabel =
          `${data.group.schoolName}, ${data.group.grade}.º ${data.group.groupLabel}`.trim()
      } catch (error) {
        setChecking(false)
        if (error instanceof ApiError && error.status === 404) {
          setErrors({
            code: 'No encontramos ese código. Pregúntale a tu maestra o maestro si está bien escrito.',
          })
          document.getElementById('codigo-grupo')?.focus()
          return
        }
        // Sin servidor: se acepta el código y se valida al enviar los resultados.
      }
      setChecking(false)
    }

    kidsStore.set({
      ...initialKidsState,
      avatar,
      badgeNumber: 1 + Math.floor(Math.random() * 99),
      groupCode: normalized || null,
      groupLabel,
      clientId: randomId(),
    })
    navigate(STEP_PATHS.pre)
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Misión detective"
        title="Tu misión: descubrir los trucos detrás del humo"
        lede="Vas a resolver seis casos sobre cómo venden vapeadores y productos con nicotina. Antes y después responderás unas preguntas rápidas para ver cuánto descubriste."
      />

      {inProgress && (
        <Notice
          tone="info"
          title="Tienes una misión a medias en este dispositivo"
          action={
            <div className="row">
              <Button
                onClick={() => navigate(STEP_PATHS[step])}
                iconAfter={<ArrowRight aria-hidden="true" className="btn__icon" />}
              >
                Continuar la misión
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmReset(true)}
                icon={<RotateCcw aria-hidden="true" className="btn__icon" />}
              >
                Empezar de nuevo
              </Button>
            </div>
          }
        >
          Si este dispositivo lo usa otra persona, empiecen de nuevo para que cada quien tenga su
          propia misión.
        </Notice>
      )}

      {!inProgress && (
        <form className="sheet stack" onSubmit={handleSubmit} noValidate>
          <ChoiceGroup<AvatarId>
            legend="Elige tu animal detective"
            hint="Será tu placa. No necesitas escribir tu nombre."
            name="avatar"
            layout="grid"
            value={avatar}
            onChange={(value) => {
              setAvatar(value)
              setErrors((e) => ({ ...e, avatar: undefined }))
            }}
            error={errors.avatar}
            options={AVATARS.map((id) => {
              const Icon = AVATAR_ICONS[id]
              return { value: id, label: AVATAR_NAMES[id], icon: <Icon /> }
            })}
          />
          <Field
            label="Código de grupo (opcional)"
            hint="Si tu maestra o maestro te dio un código, escríbelo aquí para que vea los resultados del grupo, sin tu nombre."
            error={errors.code}
            id="codigo-grupo"
          >
            {(props) => (
              <input
                {...props}
                className="input input--code"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={9}
                placeholder="ABCD-2345"
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
              />
            )}
          </Field>
          {code && !online && (
            <Notice tone="warning">
              Estás sin internet. Revisaremos el código y enviaremos tus resultados cuando haya
              conexión.
            </Notice>
          )}
          <Button
            type="submit"
            variant="magenta"
            size="l"
            loading={checking}
            icon={<Search aria-hidden="true" className="btn__icon" />}
          >
            {checking ? 'Revisando el código…' : 'Empezar la misión'}
          </Button>
        </form>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="¿Empezar una misión nueva?"
        confirmLabel="Sí, empezar de nuevo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          kidsStore.reset()
          setConfirmReset(false)
        }}
      >
        <p>Se borrarán las respuestas de la misión actual en este dispositivo.</p>
      </ConfirmDialog>
    </div>
  )
}
