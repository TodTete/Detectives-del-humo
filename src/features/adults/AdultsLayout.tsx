import { NavLink, Outlet } from 'react-router-dom'
import { CalendarCheck, LifeBuoy, ListChecks, MessageCircleQuestion, Wind } from 'lucide-react'
import { useAdultState } from './store'

const TABS = [
  { to: '/adultos', label: 'Hoy', icon: CalendarCheck, end: true, needsProfile: true },
  { to: '/adultos/plan', label: 'Mi plan', icon: ListChecks, end: false, needsProfile: true },
  { to: '/adultos/antojo', label: 'Tengo ganas', icon: Wind, end: false, needsProfile: false },
  {
    to: '/adultos/preguntar',
    label: 'Preguntar',
    icon: MessageCircleQuestion,
    end: false,
    needsProfile: false,
  },
  { to: '/adultos/ayuda', label: 'Ayuda', icon: LifeBuoy, end: false, needsProfile: false },
]

export function AdultsLayout() {
  const { profile } = useAdultState()
  const tabs = TABS.filter((t) => profile || !t.needsProfile || t.to === '/adultos')
  return (
    <div className="adults">
      <nav className="subnav" aria-label="Mi plan para dejarlo">
        <ul className="subnav__list">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className="subnav__link">
                <Icon aria-hidden="true" />
                <span>{profile || to !== '/adultos' ? label : 'Empezar'}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
