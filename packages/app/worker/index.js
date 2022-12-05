import { errorHandler } from '@web3-storage/worker-utils/error'
import { JSONResponse, notFound } from '@web3-storage/worker-utils/response'
import { Router } from '@web3-storage/worker-utils/router'
import * as cheerio from 'cheerio'
import { postTick } from './post-tick.js'
import { tokenize } from './tokenizer/index.js'

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
  const { url } = request.query
  const rsp = await fetch(url)
  const $ = cheerio.load(await rsp.text())

  const title =
    $('meta[property=og:title]').attr('content') || $('title').text()
  const description =
    $('meta[property=og:description]').attr('content') ||
    $('meta[name=description]').attr('content')
  const image = $('meta[property=og:image]').attr('content')

  const titleTags = tokenize(title, { enableStopWords: true }, false)
  const descriptionTags = tokenize(
    description || '',
    { enableStopWords: true },
    false
  )
  return new JSONResponse({
    title,
    description,
    image,
    tags: [...new Set([...titleTags, ...descriptionTags])],
  })
}

/** @type Router<import('./bindings.js').RouteContext> */
const r = new Router({ onNotFound: notFound })

r.add('get', '/api', postRoot)
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
