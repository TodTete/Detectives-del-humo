import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
    },
  ],
  webServer: {
    // Requiere `npm run build` antes (el script test:e2e lo hace).
    command: `node server/index.js`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'production',
      PORT: String(PORT),
      DATA_DIR: './node_modules/.tmp/e2e-data',
      AI_PROVIDER: '',
      ANTHROPIC_API_KEY: '',
      DEEPSEEK_API_KEY: '',
    },
  },
})
