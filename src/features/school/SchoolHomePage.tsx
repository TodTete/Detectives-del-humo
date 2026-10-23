import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from '../../lib/zod'
import { ChartColumn, Copy, Eye, Plus } from 'lucide-react'
import { Button, LinkButton } from '../../components/Button'
import { ChoiceGroup } from '../../components/ChoiceGroup'
import { Field } from '../../components/Field'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/Page'
import { useToast } from '../../components/Toast'
import { ApiError, apiRequest } from '../../lib/api'
import { useOnline } from '../../lib/useOnline'
import { GROUP_CODE_REGEX as CODE_REGEX, normalizeCode } from '../../lib/groupCode'
import type { Group } from './types'

// Mismas reglas que valida el servidor.
const groupSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre de la escuela (mínimo 3 caracteres).')
    .max(80, 'El nombre admite hasta 80 caracteres.'),
  grade: z.enum(['3', '4', '5', '6'], { error: 'Elige el grado del grupo.' }),
  groupLabel: z
    .string()
    .trim()
    .max(10, 'El grupo admite hasta 10 caracteres.')
    .regex(/^[\p{L}\p{N} ]*$/u, 'Usa solo letras y números.'),
})
type GroupInput = z.infer<typeof groupSchema>

function CreatedGroup({ group }: { group: Group }) {
  const toast = useToast()
  const [copyError, setCopyError] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Al crear el grupo, el foco pasa al resultado para que se anuncie el código.
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <section className="sheet created" aria-labelledby="created-title">
      <h2 id="created-title" className="h3" tabIndex={-1} ref={headingRef}>
        Grupo creado: {group.schoolName}, {group.grade}.º {group.groupLabel}
      </h2>
      <p>Escribe este código en el pizarrón. Cada niña o niño lo escribe al empezar su misión.</p>
      <p className="created__code" aria-label={`Código: ${group.code.split('').join(' ')}`}>
        {group.code}
      </p>
      <div className="row">
        <Button
          variant="secondary"
          icon={<Copy aria-hidden="true" className="btn__icon" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(group.code)
              toast.notify('Código copiado.')
            } catch {
              setCopyError(true)
            }
          }}
        >
          Copiar código
        </Button>
        <LinkButton
          to={`/escuelas/grupo/${group.code}`}
          icon={<ChartColumn aria-hidden="true" className="btn__icon" />}
        >
          Ver resultados del grupo
        </LinkButton>
      </div>
      {copyError && (
        <Notice tone="warning">
          No se pudo copiar automáticamente. Selecciona el código y cópialo a mano.
        </Notice>
      )}
      <p className="muted">
        Guarda el código: es la única forma de consultar los resultados del grupo.
      </p>
    </section>
  )
}

export function SchoolHomePage() {
  const navigate = useNavigate()
  const online = useOnline()
  const [created, setCreated] = useState<Group | null>(null)
  const [serverError, setServerError] = useState<string>()
  const [lookup, setLookup] = useState('')
  const [lookupError, setLookupError] = useState<string>()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { schoolName: '', groupLabel: '' },
  })

  async function onCreate(values: GroupInput) {
    setServerError(undefined)
    try {
      const data = await apiRequest<{ group: Group }>('/groups', { method: 'POST', body: values })
      setCreated(data.group)
      reset()
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo crear el grupo. Inténtalo de nuevo.',
      )
    }
  }

  function onLookup(e: FormEvent) {
    e.preventDefault()
    const code = normalizeCode(lookup.trim())
    if (!CODE_REGEX.test(code)) {
      setLookupError('Escribe el código completo, por ejemplo ABCD-2345.')
      document.getElementById('lookup-code')?.focus()
      return
    }
    navigate(`/escuelas/grupo/${code}`)
  }

  return (
    <div className="page">
      <PageHeader
        documentTitle="Escuelas"
        title="Mide lo que aprende tu grupo, sin datos personales"
        lede="Las niñas y los niños responden cinco afirmaciones antes y después de la misión. Tú ves el resultado del grupo, nunca respuestas individuales."
        actions={
          <LinkButton
            to="/escuelas/ejemplo"
            variant="secondary"
            icon={<Eye aria-hidden="true" className="btn__icon" />}
          >
            Ver un panel de ejemplo
          </LinkButton>
        }
      />

      <ol className="steps">
        <li>
          <h2 className="h3">Crea un grupo</h2>
          <p>Escribe el nombre de la escuela y el grado. Te damos un código.</p>
        </li>
        <li>
          <h2 className="h3">Comparte el código</h2>
          <p>
            Cada quien lo escribe al empezar la misión, en tableta, computadora o celular. Funciona
            sin internet y envía al reconectar.
          </p>
        </li>
        <li>
          <h2 className="h3">Consulta los resultados</h2>
          <p>Compara cuánto sabían antes y después, pregunta por pregunta.</p>
        </li>
      </ol>

      <div className="school-forms">
        <section aria-labelledby="create-title">
          {created ? (
            <CreatedGroup group={created} />
          ) : (
            <form className="sheet stack" onSubmit={handleSubmit(onCreate)} noValidate>
              <h2 id="create-title" className="h3">
                Crear un grupo
              </h2>
              {!online && (
                <Notice tone="warning">Necesitas conexión a internet para crear un grupo.</Notice>
              )}
              {serverError && (
                <Notice tone="error" live="alert">
                  {serverError}
                </Notice>
              )}
              <Field label="Nombre de la escuela" error={errors.schoolName?.message}>
                {(props) => (
                  <input
                    {...props}
                    {...register('schoolName')}
                    className="input"
                    autoComplete="organization"
                    maxLength={80}
                  />
                )}
              </Field>
              <Controller
                control={control}
                name="grade"
                render={({ field }) => (
                  <ChoiceGroup<'3' | '4' | '5' | '6'>
                    legend="Grado"
                    name="grade"
                    layout="row"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.grade?.message}
                    options={(['3', '4', '5', '6'] as const).map((g) => ({
                      value: g,
                      label: `${g}.º`,
                    }))}
                  />
                )}
              />
              <Field
                label="Grupo (opcional)"
                hint="Por ejemplo: A, B o Matutino."
                error={errors.groupLabel?.message}
              >
                {(props) => (
                  <input
                    {...props}
                    {...register('groupLabel')}
                    className="input input--short"
                    maxLength={10}
                  />
                )}
              </Field>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!online}
                icon={<Plus aria-hidden="true" className="btn__icon" />}
              >
                Crear grupo
              </Button>
            </form>
          )}
        </section>

        <section aria-labelledby="lookup-title">
          <form className="sheet stack" onSubmit={onLookup} noValidate>
            <h2 id="lookup-title" className="h3">
              Ya tengo un código
            </h2>
            <Field label="Código del grupo" error={lookupError} id="lookup-code">
              {(props) => (
                <input
                  {...props}
                  className="input input--code"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={9}
                  placeholder="ABCD-2345"
                  value={lookup}
                  onChange={(e) => {
                    setLookup(normalizeCode(e.target.value))
                    setLookupError(undefined)
                  }}
                />
              )}
            </Field>
            <Button
              type="submit"
              variant="secondary"
              icon={<ChartColumn aria-hidden="true" className="btn__icon" />}
            >
              Ver resultados
            </Button>
          </form>
          <p className="muted">
            Los resultados son agregados y anónimos. Lee{' '}
            <Link to="/privacidad">qué datos usamos</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
