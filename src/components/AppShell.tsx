import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CloudOff, Menu, Phone, RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { LogoMark } from './Logo'
import { Button } from './Button'
import { useOnline } from '../lib/useOnline'
import { LINEA_VIDA_DISPLAY, LINEA_VIDA_TEL } from '../lib/knowledge'
import { startQueueSync } from '../lib/resultsQueue'

const NAV = [
  { to: '/ninos', label: 'Misión detective' },
  { to: '/adultos', label: 'Quiero dejarlo' },
  { to: '/escuelas', label: 'Escuelas' },
]

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Revisa si hay versión nueva cada hora mientras la app está abierta.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  if (needRefresh) {
    return (
      <div className="banner banner--update" role="status">
        <RefreshCw aria-hidden="true" className="banner__icon" />
        <p>Hay una versión nueva de la app.</p>
        <div className="banner__actions">
          <Button size="s" onClick={() => void updateServiceWorker(true)}>
            Actualizar ahora
          </Button>
          <Button size="s" variant="ghost" onClick={() => setNeedRefresh(false)}>
            Después
          </Button>
        </div>
      </div>
    )
  }
  if (offlineReady) {
    return (
      <div className="banner banner--ready" role="status">
        <p>La app ya funciona sin internet en este dispositivo.</p>
        <Button size="s" variant="ghost" onClick={() => setOfflineReady(false)}>
          Entendido
        </Button>
      </div>
    )
  }
  return null
}

function useRouteFocus() {
  const location = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    // Espera a que la nueva vista se pinte y mueve el foco a su título.
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('[data-page-title]')
      ;(heading ?? document.getElementById('contenido'))?.focus({ preventScroll: false })
      window.scrollTo({ top: 0 })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname])
}

export function AppShell() {
  const online = useOnline()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const menuButton = useRef<HTMLButtonElement>(null)
  useRouteFocus()

  useEffect(() => startQueueSync(), [])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const isKids = location.pathname.startsWith('/ninos')

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <Link
            to="/"
            className="brand"
            aria-label="Detectives del Humo, inicio"
            onClick={() => setMenuOpen(false)}
          >
            <LogoMark size={38} />
            <span className="brand__name" aria-hidden="true">
              Detectives
              <br />
              del Humo
            </span>
          </Link>
          {!online && (
            <span className="pill pill--offline">
              <CloudOff aria-hidden="true" />
              Sin conexión
            </span>
          )}
          <button
            ref={menuButton}
            type="button"
            className="topbar__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span>Menú</span>
          </button>
          <nav
            id="menu-principal"
            aria-label="Principal"
            className={`topnav ${menuOpen ? 'topnav--open' : ''}`}
          >
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className="topnav__link" onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <UpdatePrompt />
      <main id="contenido" tabIndex={-1} className={`main ${isKids ? 'paper-grid' : ''}`}>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              <span className="page-loading__spinner" aria-hidden="true" />
              Cargando…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <p className="footer__help">
            ¿Necesitas hablar con alguien? Línea de la Vida{' '}
            <a href={`tel:${LINEA_VIDA_TEL}`} className="footer__tel">
              <Phone aria-hidden="true" />
              {LINEA_VIDA_DISPLAY}
            </a>{' '}
            gratuita, 24 horas.
          </p>
          <ul className="footer__links">
            <li>
              <Link to="/fuentes">Fuentes</Link>
            </li>
            <li>
              <Link to="/privacidad">Privacidad</Link>
            </li>
          </ul>
          <p className="footer__credit">
            Propuesta para el hackatón “Detrás del humo sí se ve” (CDMX, 2026). No sustituye la
            atención médica.
          </p>
        </div>
      </footer>
    </>
  )
}
