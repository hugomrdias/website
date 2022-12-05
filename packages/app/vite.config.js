import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import cf from './vite-cf/index.js'

/** @type {import('vite-plugin-pwa').VitePWAOptions} */
const pwaOptions = {
  registerType: 'prompt',
  mode: 'development',
  base: '/',
  includeAssets: ['favicon.ico', '*.jpg', '*.png', '*.svg'],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  },
  devOptions: {
    enabled: false,
  },
  manifest: {
    name: 'HD App',
    short_name: 'HD App',
    theme_color: '#5e81ac',
    background_color: '#5e81ac',
    // @ts-ignore
    share_target: {
      action: '/about/',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/maskable_icon_x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
}
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return command === 'serve'
    ? {
        build: {
          sourcemap: 'inline',
        },
        plugins: [
          preact(),
          VitePWA(pwaOptions),
          cf({
            scriptPath: './worker/index.js',
            miniflare: {
              modules: true,
              compatibilityDate: '2022-12-01',
              compatibilityFlags: ['url_standard'],
              bindings: {
                ENV: 'dev',
                DEBUG: 'false',
              },
            },
          }),
        ],
      }
    : {
        plugins: [
          VitePWA({ ...pwaOptions, mode: 'production' }),
          preact(),
          cf({
            scriptPath: './worker/index.js',
          }),
        ],
      }
})
