import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import cf from 'vite-plugin-cf-pages'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
})

/** @type {import('vite-plugin-pwa').VitePWAOptions} */
const pwaOptions = {
  registerType: 'prompt',
  mode: 'development',
  base: '/',
  includeAssets: ['favicon.ico', '*.jpg', '*.png', '*.svg'],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  },
  manifest: {
    name: 'HD App',
    short_name: 'HD App',
    theme_color: '#293042',
    background_color: '#293042',
    // @ts-ignore
    share_target: {
      action: '/share/',
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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/maskable_icon_x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
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
          sourcemap: true,
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
              kvNamespaces: ['USERS'], // KV namespace to bind
              kvPersist: './kv-data', // Persist KV data (to optional path)
              bindings: {
                ENV: 'dev',
                DEBUG: 'false',
                POSTMARK_TOKEN: process.env.POSTMARK_TOKEN,
                SESSION_SECRET: process.env.SESSION_SECRET,
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
