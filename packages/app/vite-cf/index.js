/* eslint-disable no-console */
import path from 'path'
import { build as esbuild } from 'esbuild'
import { Log, LogLevel, Miniflare } from 'miniflare'
import { fromResponse, toRequest } from './utils.js'

/**
 * Build worker with esbuild
 *
 * @param {string} workerFile
 * @param {boolean} dev
 * @param {import('vite').ResolvedConfig} config - vite config
 */
async function build(workerFile, dev, config) {
  const outfile = config.build.outDir + '/_worker.js'
  const esbuildOptions = /** @type {import('esbuild').BuildOptions} */ (
    config.esbuild
  )
  const { rebuild, outputFiles } = await esbuild({
    ...esbuildOptions,
    external: ['__STATIC_CONTENT_MANIFEST'],
    incremental: dev,
    write: !dev,
    entryPoints: [workerFile],
    bundle: true,
    allowOverwrite: true,
    format: 'esm',
    outfile,
  })

  return { rebuild, content: outputFiles?.[0].text, outfile }
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
      const { rebuild, content } = await build(workerFile, true, resolvedConfig)

      // @ts-ignore
      esbuildRebuild = rebuild

      mf = new Miniflare({
        log: new Log(LogLevel.DEBUG),
        sourceMap: true,
        wranglerConfigPath: false,
        packagePath: false,
        ...options.miniflare,
        // @ts-ignore
        script: content,
        watch: true,
      })

      process.on('beforeExit', async () => {
        await mf.dispose()
        rebuild?.dispose()
      })

      // middleware
      /** @type {import('vite').Connect.NextHandleFunction} */
      const mid = async (req, res, next) => {
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

      server.middlewares.use(mid)
      return async () => {
        await server.transformRequest(workerFile)
      }
    },

    handleHotUpdate: async ({ file, server }) => {
      const module = server.moduleGraph.getModuleById(file)
      const isImportedByWorkerFile = [...(module?.importers || [])].some(
        (importer) => importer.file === workerFile
      )

      if (module?.file === workerFile || isImportedByWorkerFile) {
        const { outputFiles } = await esbuildRebuild()
        // @ts-ignore
        await mf.setOptions({ script: outputFiles[0].text })
        server.ws.send({ type: 'full-reload' })
        server.config.logger.info(`🔥 [cloudflare] hot reloaded`)
        // we already handle the reload, so we skip the Vite's HMR handling here
        return []
      }
    },

    closeBundle: async () => {
      const { outfile } = await build(workerFile, false, resolvedConfig)

      resolvedConfig.logger.info(
        `🔥 [cloudflare] bundled worker file in '${path.relative(
          resolvedConfig.root,
          outfile
        )}'`
      )
    },
  }
}
