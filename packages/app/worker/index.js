import { errorHandler } from '@web3-storage/worker-utils/error'
import { JSONResponse, notFound } from '@web3-storage/worker-utils/response'
import { Router } from '@web3-storage/worker-utils/router'
import { parse } from './mercury/index.js'
import { postTick } from './routes/post-tick.js'
import { getUser, logout, postFinishLogin, postLogin } from './routes/login.js'
import { tokenize } from './tokenizer/index.js'
// import Parser from '@postlight/parser'

/**
 * Obtains a route context object.
 *
 * @param {Request} request
 * @param {import('./bindings').Env} env
 * @param {Pick<FetchEvent, 'waitUntil' | 'passThroughOnException'>} ctx
 * @returns {import('./bindings').RouteContext}
 */
export function getContext(request, env, ctx) {
  const url = new URL(request.url)
  return {
    url,
    env,
  }
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('./bindings.js').RouteContext} env
 */
export async function postRoot(request, env) {
  return new JSONResponse(env.env)
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('./bindings.js').RouteContext} env
 */
export async function getMeta(request, env) {
  const { url, text } = request.query
  const urlParsed = new URL(url || text)
  const { meta, raw } = await parse(urlParsed)

  const titleTags = tokenize(meta.title || '', { enableStopWords: true })
  const descriptionTags = tokenize(meta.description || '', {
    enableStopWords: true,
  })

  return new JSONResponse({
    url: url || text,
    title: meta.title,
    description: meta.description,
    image: meta.image,
    tags: [...new Set([...titleTags, ...descriptionTags])],
    feeds: meta.feeds,
    content: raw,
  })
}

/** @type Router<import('./bindings.js').RouteContext> */
const r = new Router({ onNotFound: notFound })

r.add('get', '/api', postRoot)
r.add('post', '/api/login', postLogin)
r.add('post', '/api/finish-login', postFinishLogin)
r.add('post', '/api/logout', logout)
r.add('get', '/api/user', getUser)
r.add('get', '/api/meta', getMeta)
r.add('post', '/api/tick', postTick)
r.add('get', '*', (request, env) => {
  return env.env.ENV === 'dev'
    ? new Response('', { headers: { 'x-skip-request': '' } })
    : env.env.ASSETS.fetch(request)
})

/** @type {import('./bindings.js').ModuleWorker} */
const worker = {
  fetch: async (request, env, ctx) => {
    const context = getContext(request, env, ctx)
    try {
      const rsp = await r.fetch(request, context, ctx)
      return rsp
    } catch (error) {
      return errorHandler(/** @type {Error} */ (error))
    }
  },
}

export default worker
