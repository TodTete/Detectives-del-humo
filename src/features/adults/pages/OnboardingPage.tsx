import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { PageHeader } from '../../../components/Page'
import { useToast } from '../../../components/Toast'
import { ProfileForm } from '../components/ProfileForm'
import { saveProfile } from '../store'

export function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <div className="page page--narrow">
      <PageHeader
        documentTitle="Armar mi plan"
        title="Armemos tu plan para dejar la nicotina"
        lede="Responde unas preguntas y te proponemos una reducción gradual, semana por semana. Sin regaños: cada día cuenta."
      />
      <p className="privacy-line">
        <Lock aria-hidden="true" className="inline-icon" />
        Tus respuestas se guardan solo en este dispositivo.{' '}
        <Link to="/privacidad">Más sobre privacidad</Link>.
      </p>
      <ProfileForm
        submitLabel="Crear mi plan"
        onSubmit={(values) => {
          saveProfile(values)
          toast.notify('Plan creado. Hoy empieza la primera semana.')
          navigate('/adultos/plan')
        }}
      />
    </div>
  )
}
