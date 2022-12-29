/* eslint-disable no-console */
import path from 'path'
import { build as esbuild, analyzeMetafile } from 'esbuild'
import { Log, LogLevel, Miniflare } from 'miniflare'
import { fromResponse, toRequest } from './utils.js'
import * as url from 'url'
import { createRequire } from 'module'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const WORKER_FILE = '_worker.js'

// middleware
const mid = (/** @type {Miniflare} */ mf) =>
  /** @type {import('vite').Connect.NextHandleFunction} */ (
    async (req, res, next) => {
      try {
        const mfRequest = toRequest(req)

        // @ts-ignore
        const mfResponse = await mf.dispatchFetch(mfRequest.url, mfRequest)
        if (mfResponse.headers.has('x-skip-request')) {
          return next()
        }

        // @ts-ignore
        fromResponse(mfResponse, res)
      } catch (error) {
        console.error(error)
        next(error)
      }
    }
  )

/**
 * Build worker with esbuild
 *
 * @param {string} workerFile
 * @param {boolean} dev
 * @param {import('vite').ResolvedConfig} config - vite config
 */
async function build(workerFile, dev, config) {
  const outfile = config.build.outDir + '/' + WORKER_FILE
  const esbuildOptions = /** @type {import('esbuild').BuildOptions} */ (
    config.esbuild
  )

  /** @type {ESBuildPlugin} */
  const nodePlugin = {
    name: 'node built ins',
    setup(build) {
      build.onResolve(
        { filter: /^decode-named-character-reference$/ },
        (args) => {
          return { path: require.resolve('decode-named-character-reference') }
        }
      )
    },
  }

  const { rebuild, outputFiles, metafile } = await esbuild({
    ...esbuildOptions,
    incremental: dev,
    entryPoints: [workerFile],
    bundle: true,
    plugins: [nodePlugin],
    inject: [path.join(__dirname, 'globals.js')],
    define: {
      global: 'globalThis',
    },
    allowOverwrite: true,
    format: 'esm',
    minify: !dev,
    outfile,
    sourcemap: true,
    legalComments: 'external',
    metafile: true,
  })

  return { rebuild, content: outputFiles?.[0].text, outfile, metafile }
}

/**
 * Vite Plugin
 *
 * @param {import("./types").Options} options
 * @returns {import("vite").PluginOption}
 */
export default function vitePlugin(options) {
  /** @type {Miniflare} */
  let mf
  /** @type {import("vite").ResolvedConfig} */
  let resolvedConfig
  /** @type {string} */
  let workerFile

  /** @type {import('esbuild').BuildInvalidate} */
  let esbuildRebuild
  return {
    name: 'cloudflare',
    enforce: 'post',
    configResolved: (config) => {
      resolvedConfig = config
      workerFile = path.resolve(config.root, options.scriptPath)
    },

    configureServer: async (server) => {
      console.log('dev server')
      const { rebuild } = await build(workerFile, true, resolvedConfig)

      // @ts-ignore
      esbuildRebuild = rebuild

      mf = new Miniflare({
        log: new Log(LogLevel.DEBUG),
        sourceMap: true,
        wranglerConfigPath: false,
        packagePath: false,
        ...options.miniflare,
        scriptPath: path.resolve(resolvedConfig.build.outDir, WORKER_FILE),
      })

      process.on('beforeExit', async () => {
        await mf.dispose()
        rebuild?.dispose()
      })

      server.middlewares.use(mid(mf))
      return async () => {
        await server.transformRequest(workerFile)
      }
    },

    configurePreviewServer: async (server) => {
      mf = new Miniflare({
        log: new Log(LogLevel.DEBUG),
        sourceMap: true,
        wranglerConfigPath: false,
        packagePath: false,
        ...options.miniflare,
        scriptPath: path.resolve(resolvedConfig.build.outDir, WORKER_FILE),
      })

      process.on('beforeExit', async () => {
        await mf.dispose()
      })

      server.middlewares.use(mid(mf))
    },

    handleHotUpdate: async ({ file, server }) => {
      const workerDir = path.dirname(workerFile)
      const module = server.moduleGraph.getModuleById(file)
      const isImportedByWorkerFile = [...(module?.importers || [])].some(
        (importer) =>
          importer.file === workerFile || importer.file?.startsWith(workerDir)
      )

      if (module?.file === workerFile || isImportedByWorkerFile) {
        await esbuildRebuild()
        await mf.reload()
        server.ws.send({ type: 'full-reload' })
        server.config.logger.info(`🔥 [cloudflare] hot reloaded`)
        // we already handle the reload, so we skip the Vite's HMR handling here
        return []
      }
    },

    closeBundle: async () => {
      const { outfile, metafile } = await build(
        workerFile,
        false,
        resolvedConfig
      )

      if (resolvedConfig.command !== 'serve') {
        const text = await analyzeMetafile(metafile, { color: true })
        console.log(text)
      }

      resolvedConfig.logger.info(
        `🔥 [cloudflare] bundled worker file in '${path.resolve(
          resolvedConfig.root,
          outfile
        )}'`
      )
    },
  }
}
