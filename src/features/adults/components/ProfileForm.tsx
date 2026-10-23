import { useId } from 'react'
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ChoiceGroup } from '../../../components/ChoiceGroup'
import { Field, FieldError } from '../../../components/Field'
import { Notice } from '../../../components/Notice'
import { addDays, today } from '../../../lib/dates'
import {
  DURATIONS,
  MAX_PLAN_DAYS,
  MIN_PLAN_DAYS,
  PRODUCTS,
  TRIGGERS,
  defaultTargetDate,
  profileSchema,
  type Product,
  type ProfileInput,
  type Trigger,
} from '../schema'

interface ProfileFormProps {
  defaultValues?: Partial<ProfileInput>
  submitLabel: string
  onSubmit: (values: ProfileInput) => void
}

const ORDER: (keyof ProfileInput)[] = [
  'product',
  'perDay',
  'weeklySpend',
  'duration',
  'triggers',
  'goal',
  'targetPerDay',
  'targetDate',
  'reasons',
]

export function ProfileForm({ defaultValues, submitLabel, onSubmit }: ProfileFormProps) {
  const formId = useId()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    defaultValues: {
      product: undefined,
      perDay: undefined,
      weeklySpend: undefined,
      duration: undefined,
      triggers: [],
      goal: undefined,
      targetPerDay: null,
      targetDate: defaultTargetDate(),
      reasons: '',
      ...defaultValues,
    },
  })

  const product = useWatch({ control, name: 'product' }) as Product | undefined
  const goal = useWatch({ control, name: 'goal' })
  const productInfo = product ? PRODUCTS[product] : null
  const errorCount = Object.keys(errors).length

  function onInvalid(errs: FieldErrors<ProfileInput>) {
    const first = ORDER.find((k) => errs[k])
    if (!first) return
    // Enfoca el primer campo con error (o la primera opción del grupo).
    const form = document.getElementById(formId)
    form?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  return (
    <form
      id={formId}
      className="sheet stack form"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
    >
      {submitCount > 0 && errorCount > 0 && (
        <Notice
          tone="error"
          live="alert"
          title={`Revisa ${errorCount === 1 ? 'un dato' : `${errorCount} datos`} del formulario.`}
        >
          Te marcamos en cada campo qué falta o qué hay que corregir.
        </Notice>
      )}

      <Controller
        control={control}
        name="product"
        render={({ field }) => (
          <ChoiceGroup<Product>
            legend="¿Qué consumes?"
            name="product"
            layout="grid"
            value={field.value}
            onChange={field.onChange}
            error={errors.product?.message}
            options={(Object.keys(PRODUCTS) as Product[]).map((p) => ({
              value: p,
              label: PRODUCTS[p].label,
            }))}
          />
        )}
      />

      <div className="form__row">
        <Field
          label={productInfo?.perDayLabel ?? '¿Cuántas veces al día consumes?'}
          hint="Un aproximado está bien."
          error={errors.perDay?.message}
        >
          {(props) => (
            <input
              {...props}
              {...register('perDay', { valueAsNumber: true })}
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
            />
          )}
        </Field>
        <Field
          label="¿Cuánto gastas a la semana?"
          hint="En pesos. Sirve para calcular tu ahorro."
          error={errors.weeklySpend?.message}
        >
          {(props) => (
            <div className="input-affix">
              <span aria-hidden="true">$</span>
              <input
                {...props}
                {...register('weeklySpend', { valueAsNumber: true })}
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                max={20000}
              />
            </div>
          )}
        </Field>
      </div>

      <Controller
        control={control}
        name="duration"
        render={({ field }) => (
          <ChoiceGroup
            legend="¿Desde hace cuánto consumes?"
            name="duration"
            layout="row"
            value={field.value}
            onChange={field.onChange}
            error={errors.duration?.message}
            options={(Object.keys(DURATIONS) as (keyof typeof DURATIONS)[]).map((d) => ({
              value: d,
              label: DURATIONS[d],
            }))}
          />
        )}
      />

      <Controller
        control={control}
        name="triggers"
        render={({ field }) => (
          <fieldset className={`checks ${errors.triggers ? 'choices--error' : ''}`}>
            <legend className="field__label">¿En qué momentos te dan más ganas?</legend>
            <p className="field__hint">
              Elige todos los que apliquen. Con esto armamos tus consejos de cada semana.
            </p>
            <div className="checks__list">
              {(Object.keys(TRIGGERS) as Trigger[]).map((t) => {
                const checked = field.value?.includes(t) ?? false
                return (
                  <label key={t} className={`check ${checked ? 'check--checked' : ''}`}>
                    <input
                      type="checkbox"
                      name="triggers"
                      className="check__input"
                      checked={checked}
                      onChange={(e) => {
                        const current = field.value ?? []
                        field.onChange(
                          e.target.checked ? [...current, t] : current.filter((x) => x !== t),
                        )
                      }}
                    />
                    <span className="check__box" aria-hidden="true">
                      <Check />
                    </span>
                    {TRIGGERS[t]}
                  </label>
                )
              })}
            </div>
            {errors.triggers && <FieldError>{errors.triggers.message}</FieldError>}
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="goal"
        render={({ field }) => (
          <ChoiceGroup<'dejar' | 'reducir'>
            legend="¿Cuál es tu meta?"
            name="goal"
            value={field.value}
            onChange={field.onChange}
            error={errors.goal?.message}
            options={[
              {
                value: 'dejar',
                label: 'Dejarlo por completo',
                description: 'Bajamos poco a poco hasta llegar a cero en tu fecha.',
              },
              {
                value: 'reducir',
                label: 'Reducir primero',
                description: 'Bajamos hasta la cantidad que tú elijas.',
              },
            ]}
          />
        )}
      />

      {goal === 'reducir' && (
        <Field
          label={`¿A ${productInfo?.howMany ?? 'cuántas'} ${productInfo?.unit ?? 'veces'} al día quieres llegar?`}
          error={errors.targetPerDay?.message}
        >
          {(props) => (
            <input
              {...props}
              {...register('targetPerDay', {
                setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)),
              })}
              className="input input--short"
              type="number"
              inputMode="numeric"
              min={1}
            />
          )}
        </Field>
      )}

      <Field
        label="¿Para cuándo quieres lograrlo?"
        hint={`Entre ${MIN_PLAN_DAYS} y ${MAX_PLAN_DAYS} días a partir de hoy. Cuatro semanas es un buen punto de partida.`}
        error={errors.targetDate?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('targetDate')}
            className="input input--short"
            type="date"
            min={addDays(today(), MIN_PLAN_DAYS)}
            max={addDays(today(), MAX_PLAN_DAYS)}
          />
        )}
      </Field>

      <Field
        label="¿Por qué quieres hacerlo? (opcional)"
        hint="Te lo recordaremos cuando lleguen las ganas. Se queda solo en este dispositivo."
        error={errors.reasons?.message}
      >
        {(props) => (
          <textarea
            {...props}
            {...register('reasons')}
            className="input textarea"
            rows={3}
            maxLength={200}
          />
        )}
      </Field>

      <Button type="submit" size="l" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
