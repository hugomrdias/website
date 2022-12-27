import { JSONResponse } from '@web3-storage/worker-utils/response'
import { sealData, unsealData, getIronSession } from 'iron-session/edge'
import { Email } from '../utils/email.js'

const PASSWORD = 'complex_password_at_least_32_characters_long'
/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('../bindings.js').RouteContext} env
 */
export async function postLogin(request, env) {
  const email = new Email({
    token: '2d3a99f7-af15-4dba-b923-7b3e13c83b79',
  })
  const data = await request.json()

  const seal = await sealData(
    {
      email: data.email,
    },
    {
      password: PASSWORD,
      ttl: 15 * 60,
    }
  )

  const url = `${env.url.protocol}//${env.url.host}/callback?seal=${seal}`

  await email.send({
    subject: 'Validate email',
    textBody: `<html><body><strong>Hey there</strong>, <a href="${url}">click here to login</a>.</body></html>`,
    to: data.email,
  })

  return new JSONResponse({
    ok: true,
  })
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('../bindings.js').RouteContext} env
 */
export async function postFinishLogin(request, env) {
  const data = await request.json()
  const out = await unsealData(data.seal, {
    password: PASSWORD,
  })

  const user = { email: out.email, isLoggedIn: true }
  const rsp = new JSONResponse(user)
  const session = await getIronSession(request, rsp, {
    cookieName: 'hd-app',
    password: PASSWORD,
    cookieOptions: {
      secure: false,
    },
  })
  session.user = user
  await session.save()
  return rsp
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('../bindings.js').RouteContext} env
 */
export async function getUser(request, env) {
  const session = await getIronSession(request, new JSONResponse({}), {
    cookieName: 'hd-app',
    password: PASSWORD,
    cookieOptions: {
      secure: true,
    },
  })

  return session.user
    ? new JSONResponse(session.user)
    : new JSONResponse({ email: undefined, isLoggedIn: false })
}

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('../bindings.js').RouteContext} env
 */
export async function logout(request, env) {
  const user = { email: null, isLoggedIn: false }
  const rsp = new JSONResponse({
    user,
  })
  const session = await getIronSession(request, rsp, {
    cookieName: 'hd-app',
    password: PASSWORD,
    cookieOptions: {
      secure: true,
    },
  })

  session.destroy()
  return rsp
}
