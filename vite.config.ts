/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

/** Precarga las fuentes del build para evitar el salto de diseño al cambiar de fuente. */
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) => file.endsWith('.woff2'))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

const API_PORT = process.env.PORT ?? '8787'

export default defineConfig({
  plugins: [
    react(),
    preloadFonts(),
    VitePWA({
      // El usuario decide cuándo actualizar: nunca se sirve una versión nueva a medias.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Detectives del Humo',
        short_name: 'Det. del Humo',
        description:
          'Aprende a descubrir los trucos con los que venden vapeadores y productos de nicotina. Incluye un plan para dejar de consumir y un panel para escuelas.',
        lang: 'es-MX',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F4F7FC',
        theme_color: '#1C2147',
        categories: ['education', 'health'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Misión detective',
            short_name: 'Misión',
            url: '/ninos',
            icons: [{ src: 'pwa-192.png', sizes: '192x192' }],
          },
          {
            name: 'Mi plan para dejarlo',
            short_name: 'Mi plan',
            url: '/adultos',
            icons: [{ src: 'pwa-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // Solo en la primera instalación toma control de inmediato (no hay versión anterior que reemplazar);
        // las actualizaciones esperan a que la persona pulse "Actualizar ahora".
        clientsClaim: true,
        // Las llamadas a la API nunca se sirven desde caché: los datos deben ser reales.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: { '/api': `http://localhost:${API_PORT}` },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.js'],
    css: false,
    restoreMocks: true,
  },
})
