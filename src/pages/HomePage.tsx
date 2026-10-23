import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, School } from 'lucide-react'
import { LinkButton } from '../components/Button'
import { useDocumentTitle } from '../components/Page'
import { LogoMark } from '../components/Logo'

export function HomePage() {
  useDocumentTitle('')
  return (
    <div className="home">
      <section className="hero paper-grid" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__copy">
            <h1 id="hero-title" tabIndex={-1} data-page-title className="hero__title">
              <span className="marker">Detrás del humo</span> hay alguien que quiere venderte algo.
            </h1>
            <p className="hero__lede">
              Una misión para niñas y niños de 8 a 12 años: resuelve seis casos y descubre los
              trucos con los que venden vapeadores y productos de nicotina.
            </p>
            <div className="hero__actions">
              <LinkButton
                to="/ninos"
                variant="magenta"
                size="l"
                iconAfter={<ArrowRight aria-hidden="true" className="btn__icon" />}
              >
                Empezar la misión
              </LinkButton>
              <p className="hero__note">Dura unos 15 minutos. No pedimos tu nombre.</p>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <div className="hero__smoke hero__smoke--a" />
            <div className="hero__smoke hero__smoke--b" />
            <div className="hero__smoke hero__smoke--c" />
            <LogoMark size={260} className="hero__lens" />
          </div>
        </div>
      </section>

      <section className="audiences" aria-labelledby="audiences-title">
        <h2 id="audiences-title" className="audiences__title">
          También hay un espacio para quienes acompañan
        </h2>
        <div className="audiences__list">
          <Link to="/adultos" className="audience">
            <HeartHandshake aria-hidden="true" className="audience__icon" />
            <span className="audience__text">
              <span className="audience__name">Quiero dejar de consumir nicotina</span>
              <span className="audience__desc">
                Arma un plan gradual, registra tu avance, ve cuánto ahorras y pide ayuda cuando
                lleguen las ganas.
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="audience__arrow" />
          </Link>
          <Link to="/escuelas" className="audience">
            <School aria-hidden="true" className="audience__icon" />
            <span className="audience__text">
              <span className="audience__name">Soy docente o directivo</span>
              <span className="audience__desc">
                Crea un grupo, comparte el código con tu clase y mide qué aprendieron, antes y
                después, sin datos personales.
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="audience__arrow" />
          </Link>
        </div>
      </section>

      <section className="why" aria-labelledby="why-title">
        <h2 id="why-title">Por qué empezar en la primaria</h2>
        <div className="why__grid">
          <p>
            Los sabores de dulce y los diseños que parecen juguetes atraen a niñas, niños y jóvenes,
            según la Organización Mundial de la Salud. La publicidad llega antes que la información.
          </p>
          <p>
            El cerebro sigue creciendo hasta cerca de los 25 años, y la nicotina puede afectar la
            atención, la memoria y el aprendizaje.
          </p>
          <p>
            En México la Constitución prohíbe vender vapeadores desde enero de 2025, pero siguen
            apareciendo cerca de las escuelas y en redes sociales.
          </p>
        </div>
        <p className="why__sources">
          <Link to="/fuentes">Consulta las fuentes de cada dato</Link>
        </p>
      </section>
    </div>
  )
}
