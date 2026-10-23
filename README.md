# Detectives del Humo

Aplicación web progresiva (PWA) de prevención del consumo de nicotina para niñas y niños de 8 a 12 años en primarias de la Ciudad de México, con un módulo de cesación para personas adultas y un panel escolar con resultados anónimos.

Propuesta para el hackatón **“Detrás del humo sí se ve”** (SUR Institute y CREA, CDMX, 22 y 23 de octubre de 2026).

---

## 1. La estrategia (lo que la app tiene que lograr)

> Hoy, la autoridad educativa de la CDMX no cuenta con una herramienta para prevenir el consumo de nicotina en primarias. Queremos que integre *Detectives del Humo* en sus actividades de vida saludable, porque las niñas y los niños de 8 a 12 años ya son blanco del marketing de estos productos antes de que alguien les hable del tema.

| Definición | Respuesta |
| --- | --- |
| Problema | Las infancias conocen estos productos por el marketing antes que por la escuela. |
| Público objetivo (decisor) | Coordinación de salud escolar de la autoridad educativa en la CDMX *(hipótesis a validar)*. |
| Acción | Aprobar un piloto de la app en primarias. |
| Insight | Los niños no se ven como consumidores, pero ya son clientes en la mira de la industria. |

La app es la **herramienta** y también la **evidencia** para el decisor: el panel escolar mide el cambio antes y después (diapositiva 22 del taller: *“si queremos cambiar percepciones, exploramos qué piensan antes y después”*).

## 2. Módulos

| Módulo | Ruta | Para quién | Qué hace |
| --- | --- | --- | --- |
| Misión detective | `/ninos` | Niñas y niños de 8 a 12 | Cuestionario previo → 6 casos con la “lupa” que revela el truco de marketing → frase para decir que no → cuestionario final → certificado descargable. Sin nombres ni datos personales. |
| Mi plan para dejarlo | `/adultos` | Personas adultas | Diagnóstico, meta (dejarlo o reducir), plan semanal gradual con consejos según sus detonantes, registro diario, racha, ahorro, antojos superados, regla de los 10 minutos con respiración guiada, asistente con la guía verificada y ayuda (Línea de la Vida). |
| Escuelas | `/escuelas` | Docentes y directivos | Crear un grupo con código, consultar resultados agregados antes/después por afirmación, exportar CSV. Incluye un panel de ejemplo rotulado (`/escuelas/ejemplo`). |
| Fuentes y privacidad | `/fuentes`, `/privacidad` | Todas las personas | Cada dato de la app con su fuente; qué datos se usan y dónde se guardan. |

### Decisiones de diseño de contenido

- **Ángulo “curiosidad” y “poder”** (taller, diapositivas 16 y 18): en lugar de asustar, la misión enseña a reconocer cómo venden el producto. Corresponde a la acción “reconocer una estrategia de marketing” (diapositiva 14).
- **Guía verificada única** (`shared/knowledge.json`): todo el contenido de salud, la IA y la respuesta sin conexión salen de 12 hechos con fuente. El equipo de salud puede revisarla en un solo archivo.
- **Seguridad infantil**: el módulo infantil no tiene chat ni IA; su contenido es fijo y revisable.
- **La IA solo vive en el módulo adulto**, responde únicamente con la guía, no da dosis ni diagnósticos, y ante señales de crisis responde con la Línea de la Vida sin llamar a la IA.

## 3. Arquitectura

```
Navegador (PWA, React)                         Servidor (Node + Express)
┌───────────────────────────────┐              ┌──────────────────────────────┐
│ Misión detective  ─┐          │  POST        │ /api/groups      crear grupo │
│ Mi plan (local)    ├─ vistas  │ ───────────▶ │ /api/groups/:c   estadísticas│
│ Escuelas          ─┘          │  /api/*      │ /api/results     resultado   │
│                               │              │ /api/ask         asistente ──┼──▶ API de Claude (opcional)
│ localStorage: misión y plan   │              │ archivo JSON (DATA_DIR)      │
│ Cola de envío sin conexión    │              │ Sirve dist/ en producción    │
│ Service Worker (Workbox)      │              └──────────────────────────────┘
└───────────────────────────────┘
          shared/knowledge.json · shared/guide.js · shared/kb-search.js (cliente y servidor)
```

- **Cliente**: React 19 + TypeScript + Vite. Cada módulo se carga de forma diferida en un solo archivo, así que una misión abierta se puede terminar sin conexión.
- **Persistencia en el dispositivo**: almacén reactivo sobre `localStorage` con validación de lo que se lee (tolera datos corruptos o de otra versión) y sin fallar si el almacenamiento está bloqueado.
- **Cola sin conexión**: los resultados de la misión se guardan y se envían al reconectar; los reintentos son idempotentes (`clientId` aleatorio, no ligado a la persona).
- **Servidor**: Express 5 con validación Zod, límites de solicitudes, CSP estricta, compresión, encabezados de seguridad y errores en español que nunca exponen detalles internos. Guarda solo resultados agregables (aciertos, confianza, casos y fecha sin hora).

### Estructura

```
src/
  components/      Sistema de diseño: botones, campos, opciones, diálogo, avisos, gráfica accesible, shell
  features/
    kids/          Misión: datos (casos, cuestionario), estado, certificado (canvas), vistas
    adults/        Plan: esquema, cálculo del plan y estadísticas, almacén, vistas
    school/        Panel escolar
  lib/             API con tiempo límite, almacenamiento seguro, cola, fechas, conectividad
  pages/           Inicio, fuentes, privacidad, 404
  styles/          tokens.css (identidad), base, componentes y módulos
server/            app.js (rutas), ai.js, store.js, stats.js, schemas.js, rateLimit.js, pruebas
shared/            Guía verificada y búsqueda (compartidas por cliente y servidor)
e2e/               Pruebas end-to-end, accesibilidad, diseño adaptable y PWA
scripts/           Generación de íconos y capturas de pantalla
```

## 4. Tecnologías y por qué

| Necesidad | Elegido | Por qué (y qué se descartó) |
| --- | --- | --- |
| UI | React 19 + TypeScript | Ecosistema estable, tipado estricto. |
| Build | Vite 8 | Rápido, división de código. |
| PWA | vite-plugin-pwa (Workbox) | Precaché, actualización con aviso, `navigateFallback`. |
| Rutas | React Router 7 | Rutas anidadas por módulo y manejo de errores de carga. |
| Formularios | React Hook Form + Zod 4 | Validación compartida con el servidor. Zod en modo `jitless` para no requerir `unsafe-eval` en la CSP. |
| Iconos | Lucide | Un solo estilo SVG, ligero y con *tree-shaking*. Sin emojis como iconos. |
| Gráficas | SVG propio | Dos gráficas de barras sencillas no justificaban ECharts/Chart.js; incluye tabla alternativa y patrón (no depende solo del color). |
| Animación | CSS | Un solo momento animado (la lupa que revela el truco). Motion/GSAP no aportaban lo suficiente para su peso. Respeta `prefers-reduced-motion`. |
| Componentes | Propios | Sin framework de componentes: identidad propia y control total de accesibilidad. Los diálogos usan `<dialog>` nativo. |
| Estado | `useSyncExternalStore` | No se necesitó Redux/Zustand. |
| Servidor | Express 5 + compression | Mínimo y conocido. |
| Pruebas | Vitest, Testing Library, Supertest, Playwright, axe-core, Lighthouse | Ver sección 7. |

**Identidad visual**: cuaderno de cuadrícula de primaria + marcatextos, con los colores de “Detrás del humo” (tinta índigo, magenta, amarillo). Tipografías Bricolage Grotesque (títulos) y Atkinson Hyperlegible (texto, diseñada para máxima legibilidad), autohospedadas para funcionar sin conexión. Tema claro y oscuro.

## 5. Cómo ejecutarlo

Requisitos: **Node.js 20 o superior**.

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run dev                 # API en :8787 y app en http://localhost:5173
```

Producción local (la misma app que se desplegaría, con service worker activo):

```bash
npm run build
npm start                   # http://localhost:8787
```

> El service worker solo funciona en `localhost` o con HTTPS. Para probar la instalación en un teléfono, despliega con HTTPS (sección 6).

### Variables de entorno (`.env`)

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `8787` | Puerto del servidor. |
| `DATA_DIR` | `./data` | Carpeta del archivo `db.json` con grupos y resultados anónimos. |
| `AI_PROVIDER` | vacío | `anthropic` o `deepseek`. Si está vacío, se usa el proveedor que tenga clave (Anthropic primero). **Sin ninguna clave, la app funciona igual**: el asistente responde con la guía verificada. Las claves viven solo en el servidor. |
| `ANTHROPIC_API_KEY` | vacío | Clave de la API de Claude. |
| `ANTHROPIC_MODEL` | `claude-haiku-5-5` | Modelo de Claude. |
| `ANTHROPIC_VERSION` | `2023-06-01` | Encabezado `anthropic-version`. Consulta la versión vigente en la [documentación de la API](https://docs.claude.com/en/api/overview). |
| `DEEPSEEK_API_KEY` | vacío | Clave de la API de DeepSeek. |
| `DEEPSEEK_MODEL` | `deepseek-flash` | Modelo de DeepSeek (`deepseek-flash` o `deepseek-v4-pro`). Se usa sin “modo de razonamiento” para respuestas cortas y rápidas. |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | Dirección de la API de DeepSeek. |

Para usar DeepSeek basta con poner `AI_PROVIDER=deepseek` y `DEEPSEEK_API_KEY=...` en `.env` y reiniciar. Al arrancar, el servidor indica qué proveedor y modelo usa, y `GET /api/health` lo devuelve en `provider`.
| `ALLOWED_ORIGINS` | vacío | CORS solo si el frontend vive en otro dominio. |

### Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Desarrollo (API + Vite con proxy). |
| `npm run build` | Verificación de tipos y build de producción. |
| `npm start` | Sirve `dist/` y la API. |
| `npm test` | Pruebas unitarias, de componentes y de API. |
| `npm run test:e2e` | Build y pruebas end-to-end en Chromium (móvil y escritorio). Requiere `npx playwright install chromium` la primera vez. |
| `npm run lint` | ESLint (TypeScript, hooks de React y jsx-a11y). |
| `npm run icons` | Regenera los íconos PNG desde `public/favicon.svg`. |

## 6. Despliegue

Cualquier servicio que ejecute Node con HTTPS sirve (Render, Railway, Fly.io, Google Cloud Run, Azure App Service, OCI). La app y la API van en el mismo servicio.

- **Comando de build**: `npm ci && npm run build`
- **Comando de inicio**: `npm start`
- **Variables**: `NODE_ENV=production`, `DATA_DIR` apuntando a un **disco persistente**, y la clave de IA (`ANTHROPIC_API_KEY`, o `AI_PROVIDER=deepseek` con `DEEPSEEK_API_KEY`) si quieres IA.

Con Docker:

```bash
docker build -t detectives-del-humo .
docker run -p 8787:8787 -v ddh-data:/data -e ANTHROPIC_API_KEY=... detectives-del-humo
# o con DeepSeek:
docker run -p 8787:8787 -v ddh-data:/data -e AI_PROVIDER=deepseek -e DEEPSEEK_API_KEY=... detectives-del-humo
```

> Si la plataforma tiene disco efímero (por ejemplo Cloud Run sin volumen), los grupos se pierden al reiniciar. Para un piloto real usa un volumen o sustituye `server/store.js` por una base de datos administrada; la interfaz del almacén es pequeña (`getGroup`, `addGroup`, `getResults`, `addResult`).

## 7. Pruebas ejecutadas y resultados

Ejecutadas el 23 de octubre de 2026 en Linux con Node 22 y Chromium 153.

| Tipo | Herramienta | Resultado |
| --- | --- | --- |
| Tipos | `tsc -b` (modo estricto) | Sin errores |
| Análisis estático | ESLint + typescript-eslint + react-hooks + jsx-a11y | Sin errores ni advertencias |
| Unitarias | Vitest | Plan semanal, estadísticas (racha, ahorro), validaciones, calificación, avance de la misión, búsqueda en la guía, detección de crisis, almacenamiento tolerante a fallas, cola sin conexión |
| Componentes | Testing Library | Grupos de opciones, campos con errores asociados, gráfica con tabla alternativa, formulario del plan |
| API / integración | Vitest + Supertest | Validación, JSON mal formado, idempotencia, agregación, 404, límite de solicitudes, IA simulada y su respaldo, persistencia en archivo, encabezados de seguridad |
| **Total unitarias + API** | | **46 de 46 aprobadas** |
| End-to-end | Playwright (Pixel 7 y escritorio 1280 px) | Misión completa con envío al grupo y certificado; código inexistente; no saltarse pasos; envío en cola sin conexión y al reconectar; plan adulto completo (crear, registrar, editar, borrar, antojo, exportar); asistente con y sin conexión y ante falla del servidor; panel escolar (crear, copiar, vacío, 404, error recuperable, ejemplo y CSV) |
| Accesibilidad | axe-core (WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) | Sin violaciones en 11 páginas, en cada paso de la misión, con formularios en error y en tema claro y oscuro |
| Teclado y foco | Playwright | Enlace “Saltar al contenido”, foco al título al navegar, cuestionario solo con teclado, menú con Escape y retorno del foco, diálogo con Escape y retorno del foco |
| Adaptable | Playwright | Sin desplazamiento horizontal a 320, 375, 768, 1024 y 1440 px; controles de al menos 44 px |
| Movimiento reducido | Playwright | Animaciones desactivadas con `prefers-reduced-motion` |
| PWA | Playwright | Manifiesto e íconos (incluido *maskable*), service worker registrado y en control, misión, plan y fuentes sin conexión, aviso de “necesitas conexión” donde aplica, API nunca cacheada |
| Consola y CSP | Playwright | Sin errores de consola ni violaciones de la política de seguridad |
| **Total e2e** | | **54 aprobadas, 8 omitidas a propósito** (pruebas de teclado físico solo en escritorio y del menú solo en móvil) |
| Dependencias | `npm audit` | 0 vulnerabilidades |
| Lighthouse 12 (móvil simulado, CPU 4× más lenta) | | Inicio: rendimiento 96. Misión, plan y panel: rendimiento 77–88. Accesibilidad, buenas prácticas y SEO: 100 en las páginas medidas |

### Pendiente de validar (no se marcó como aprobado)

- **Lectores de pantalla reales** (VoiceOver, TalkBack, NVDA): la estructura se verificó con axe y pruebas de roles, pero no con un lector de pantalla.
- **Safari / iOS y Firefox**: las pruebas automáticas corrieron en Chromium. En iOS la instalación es desde “Compartir → Agregar a inicio”.
- **Asistente con IA real**: Claude y DeepSeek se probaron con respuestas simuladas que siguen el formato de cada API; no se llamó a las APIs reales porque no había claves en este entorno.
- **Imagen de Docker**: el `Dockerfile` no se construyó en este entorno.
- **Revisión del contenido** por las personas de salud del equipo y por los mentores, antes de cualquier piloto.

## 8. Limitaciones conocidas

- El panel escolar no tiene inicio de sesión: quien tenga el código ve los resultados agregados (nunca individuales). Para un piloto con escuelas reales conviene añadir una clave para docentes.
- Almacenamiento en un archivo JSON: suficiente para el hackatón y pilotos pequeños.
- El contenido está solo en español.

## 9. Guion de demo para el pitch (2 minutos)

1. **Inicio** (10 s): “Detrás del humo hay alguien que quiere venderte algo.”
2. **Escuelas** (20 s): crear un grupo en vivo y mostrar el código grande.
3. **Misión** (50 s) en un teléfono: escribir el código, responder una pregunta, resolver *El caso de los sabores* con la lupa y mostrar el certificado.
4. **Panel** (20 s): volver al grupo y mostrar el resultado que acaba de llegar, o el panel de ejemplo con el cambio de 46 % a 87 %.
5. **Cierre con el decisor** (20 s): “Le pedimos a la coordinación de salud escolar un piloto en 5 primarias. Ya está lista, funciona sin internet y mide resultados sin datos personales.”

Mencionen que el módulo adulto existe porque muchas niñas y niños conviven con personas que consumen: es la “puerta” a la que llegar después de la campaña.

## 10. Fuentes

- OMS sobre sabores y diseños dirigidos a jóvenes: [Expansión, mayo de 2024](https://expansion.mx/empresas/2024/05/23/oms-acusa-tabacaleras-enganchar-jovenes-vaporizadores)
- Contenido del aerosol y efectos en el cerebro (CDC y Surgeon General): [Departamento de Salud de Texas](https://www.dshs.texas.gov/tobacco/E-Cigarettes)
- Reforma constitucional (DOF 17/01/2025): [IDC Online](https://idconline.mx/corporativo/2025/01/22/oficial-prohibicion-de-vapeadores-y-el-uso-ilegal-de-fentanilo)
- Reforma a la Ley General de Salud aprobada en la Cámara de Diputados: [Vanguardia, diciembre de 2025](https://www.vanguardia.com/mundo/2025/12/09/mexico-prohibe-totalmente-los-vapeadores-y-cigarrillos-electronicos/)
- Manejo de antojos: [MedlinePlus](https://medlineplus.gov/ency/patientinstructions/000854.htm)
- Línea de la Vida 800 911 2000: [CONASAMA vía Noticias Gobierno](https://www.noticiasgobierno.com/atencion-psicologica-gratuita-linea-de-la-vida-2026/)

La app no sustituye la atención médica ni psicológica.
