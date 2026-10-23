import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RouteError } from './components/RouteError'
import { ToastProvider } from './components/Toast'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { SourcesPage } from './pages/SourcesPage'

// Cada módulo (misión, plan, escuelas) se descarga solo cuando se visita y queda en caché para usarse sin conexión.
const kids = () => import('./features/kids')
const adults = () => import('./features/adults')
const school = () => import('./features/school')

const KidsLayout = lazy(() => kids().then((m) => ({ default: m.KidsLayout })))
const KidsIntroPage = lazy(() => kids().then((m) => ({ default: m.KidsIntroPage })))
const KidsQuizPage = lazy(() => kids().then((m) => ({ default: m.KidsQuizPage })))
const KidsCasesPage = lazy(() => kids().then((m) => ({ default: m.KidsCasesPage })))
const KidsResponsePage = lazy(() => kids().then((m) => ({ default: m.KidsResponsePage })))
const KidsResultPage = lazy(() => kids().then((m) => ({ default: m.KidsResultPage })))

const AdultsLayout = lazy(() => adults().then((m) => ({ default: m.AdultsLayout })))
const TodayPage = lazy(() => adults().then((m) => ({ default: m.TodayPage })))
const PlanPage = lazy(() => adults().then((m) => ({ default: m.PlanPage })))
const CravingPage = lazy(() => adults().then((m) => ({ default: m.CravingPage })))
const AskPage = lazy(() => adults().then((m) => ({ default: m.AskPage })))
const HelpPage = lazy(() => adults().then((m) => ({ default: m.HelpPage })))

const SchoolHomePage = lazy(() => school().then((m) => ({ default: m.SchoolHomePage })))
const SchoolDashboardPage = lazy(() => school().then((m) => ({ default: m.SchoolDashboardPage })))
const SchoolDemoPage = lazy(() => school().then((m) => ({ default: m.SchoolDemoPage })))

export const routes = [
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'ninos',
        element: <KidsLayout />,
        children: [
          { index: true, element: <KidsIntroPage /> },
          { path: 'antes', element: <KidsQuizPage key="pre" mode="pre" /> },
          { path: 'casos', element: <KidsCasesPage /> },
          { path: 'mi-frase', element: <KidsResponsePage /> },
          { path: 'despues', element: <KidsQuizPage key="post" mode="post" /> },
          { path: 'resultado', element: <KidsResultPage /> },
        ],
      },
      {
        path: 'adultos',
        element: <AdultsLayout />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'plan', element: <PlanPage /> },
          { path: 'antojo', element: <CravingPage /> },
          { path: 'preguntar', element: <AskPage /> },
          { path: 'ayuda', element: <HelpPage /> },
        ],
      },
      { path: 'escuelas', element: <SchoolHomePage /> },
      { path: 'escuelas/ejemplo', element: <SchoolDemoPage /> },
      { path: 'escuelas/grupo/:code', element: <SchoolDashboardPage /> },
      { path: 'fuentes', element: <SourcesPage /> },
      { path: 'privacidad', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

const router = createBrowserRouter(routes)

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
