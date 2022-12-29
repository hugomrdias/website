import { Hono, Handler as HonoHandler } from 'hono'
import { IronSession } from 'iron-session'
import { Email } from './utils/email.js'
import { Users } from './utils/users.js'
export {}

export interface Env {
  // vars
  ENV: string
  DEBUG: string
  POSTMARK_TOKEN: string
  SESSION_SECRET: string
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  USERS: KVNamespace
}

export interface Vars {
  url: URL
  email: Email
  users: Users
}

export type App = Hono<{ Bindings: Env; Variables: Vars }>
export type AppHandler<T = any> = HonoHandler<
  string,
  { Bindings: Env; Variables: Vars },
  T
>

export type ExtractValidationType<T> = Parameters<
  ReturnType<T>
>[0]['req']['data']

declare module 'iron-session' {
  interface IronSessionData {
    user: { email: string; isLoggedIn: boolean; otp: boolean }
  }
}

declare module 'hono' {
  interface ContextVariableMap {
    session: IronSession
  }
}
