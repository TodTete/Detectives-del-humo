import { z } from 'zod'

// Sin compilación con `new Function`: respeta la política de seguridad (CSP sin 'unsafe-eval').
z.config({ jitless: true })

export { z }
