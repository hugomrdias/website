import type { MiniflareOptions } from 'miniflare'
import { BuildOptions } from 'esbuild'

export interface Options {
  // miniflare specific options for development (optional)
  miniflare?: Omit<MiniflareOptions, 'script' | 'watch'>
  // the worker file (required)
  scriptPath: string
  esbuild?: Partial<BuildOptions>
}
