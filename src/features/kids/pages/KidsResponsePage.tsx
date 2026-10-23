import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ChoiceGroup } from '../../../components/ChoiceGroup'
import { Notice } from '../../../components/Notice'
import { PageHeader } from '../../../components/Page'
import { RESPONSES } from '../data/cases'
import { STEP_PATHS, kidsStore, useKidsState } from '../state'

export function KidsResponsePage() {
  const navigate = useNavigate()
  const state = useKidsState()
  const [value, setValue] = useState<string | null>(state.response)
  const [error, setError] = useState<string>()

  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Mi frase detective"
        title="Si alguien te ofrece, ¿qué dirías?"
        lede="Un buen detective tiene su frase lista. Elige la que más te guste: aparecerá en tu certificado."
      />
      <div className="sheet stack">
        <ChoiceGroup<string>
          legend="Mi frase detective"
          name="response"
          value={value}
          onChange={(v) => {
            setValue(v)
            setError(undefined)
          }}
          error={error}
          options={RESPONSES.map((r) => ({ value: r.id, label: `“${r.text}”` }))}
        />
        <Notice tone="info" title="Recuerda">
          Decir que no está bien, aunque sea una amiga, un amigo o alguien mayor. Si alguien insiste
          o te los ofrece en la escuela, cuéntaselo a un adulto de confianza.
        </Notice>
        <Button
          size="l"
          onClick={() => {
            if (!value) {
              setError('Elige una frase para continuar.')
              return
            }
            kidsStore.set((prev) => ({ ...prev, response: value }))
            navigate(STEP_PATHS.post)
          }}
          iconAfter={<ArrowRight aria-hidden="true" className="btn__icon" />}
        >
          Ir a las preguntas finales
        </Button>
      </div>
    </div>
  )
}
