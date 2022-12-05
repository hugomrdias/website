import type { Handler as _Handler } from '@web3-storage/worker-utils/router'
export {}

// CF Analytics Engine types not available yet
export interface AnalyticsEngine {
  writeDataPoint: (event: AnalyticsEngineEvent) => void
}

export interface AnalyticsEngineEvent {
  readonly doubles?: number[]
  readonly blobs?: Array<ArrayBuffer | string | null>
}

export interface Env {
  // vars
  ENV: string
  DEBUG: string
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

export interface RouteContext {
  url: URL
  env: Env
}

export type Handler = _Handler<RouteContext>

export type Bindings = Record<
  string,
  | KVNamespace
  | DurableObjectNamespace
  | CryptoKey
  | string
  | D1Database
  | AnalyticsEngine
>
declare namespace ModuleWorker {
  type FetchHandler<Environment extends Bindings = Bindings> = (
    request: Request,
    env: Environment,
    ctx: Pick<FetchEvent, 'waitUntil' | 'passThroughOnException'>
  ) => Promise<Response> | Response

  type CronHandler<Environment extends Bindings = Bindings> = (
    event: Omit<ScheduledEvent, 'waitUntil'>,
    env: Environment,
    ctx: Pick<ScheduledEvent, 'waitUntil'>
  ) => Promise<void> | void
}

export interface ModuleWorker {
  fetch?: ModuleWorker.FetchHandler<Env>
  scheduled?: ModuleWorker.CronHandler<Env>
}
