import { PageHeader } from '../components/Page'

export function PrivacyPage() {
  return (
    <div className="page page--narrow prose">
      <PageHeader
        documentTitle="Privacidad"
        title="Qué datos usamos"
        lede="La app está pensada para niñas y niños, así que recoge lo mínimo y nunca pide nombres, correos ni teléfonos."
      />
      <h2>Misión detective</h2>
      <p>
        Las respuestas se guardan solo en este dispositivo. Si tu maestra o maestro te dio un código
        de grupo, al terminar se envía un resultado anónimo: qué afirmaciones acertaste antes y
        después, cuántos casos resolviste y la fecha. No se envía tu nombre de detective ni nada que
        te identifique.
      </p>
      <h2>Mi plan para dejarlo</h2>
      <p>
        Tu plan, tus registros y tus razones se guardan solo en este dispositivo y no se envían a
        ningún servidor. Puedes borrarlos cuando quieras desde la sección “Mi plan”. Si usas el
        asistente, tu pregunta se envía al servidor de la app y, si la IA está activada, a un
        servicio externo de inteligencia artificial para responderla. La app no la guarda.
      </p>
      <h2>Panel escolar</h2>
      <p>
        El panel muestra solo resultados agregados del grupo. Nunca muestra respuestas individuales.
        Cualquier persona con el código puede ver esos resultados agregados, así que compártelo solo
        con tu comunidad escolar.
      </p>
    </div>
  )
}
