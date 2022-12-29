import { sealData, unsealData } from 'iron-session/edge'
import { buildURL, parse, totp } from 'micro-otp'
import { generateKey } from '../utils/otp.js'
import QRCode from 'qrcode'

/** @type {import('../bindings.js').AppHandler} */
export async function postLogin(c) {
  const email = c.get('email')
  const reqUrl = c.get('url')
  const data = await c.req.json()
  const seal = await sealData(
    {
      email: data.email,
    },
    {
      password: c.env.SESSION_SECRET,
      ttl: 15 * 60,
    }
  )

  const url = `${reqUrl.protocol}//${reqUrl.host}/callback?seal=${seal}`

  await email.send({
    subject: 'Validate email',
    textBody: `<html><body><strong>Hey there</strong>, <a href="${url}">click here to login</a>.</body></html>`,
    to: data.email,
  })

  return c.json({
    ok: true,
  })
}

/** @type {import('../bindings.js').AppHandler} */
export async function postFinishLogin(c) {
  const data = await c.req.json()
  const session = c.get('session')
  const { email } = await unsealData(data.seal, {
    password: c.env.SESSION_SECRET,
  })

  const user = await c.get('users').getOrCreate(/** @type {string} */ (email))

  const out = { email: user.email, isLoggedIn: false, otp: false }

  if (user.otp) {
    out.otp = true
  } else {
    out.isLoggedIn = true
  }

  session.user = out
  await session.save()
  return c.json(out)
}

/** @type {import('../bindings.js').AppHandler} */
export async function getUser(c) {
  const session = c.get('session')
  const user = await c.get('users').get(session.user.email)

  return session.user ? c.json(user) : c.json({})
}

/** @type {import('../bindings.js').AppHandler} */
export async function logout(c) {
  const session = c.get('session')

  session.destroy()
  return c.json({})
}

/** @type {import('../bindings.js').AppHandler} */
export async function postUser(c) {
  const data = await c.req.json()
  const session = c.get('session')

  return c.json(await c.get('users').put(session.user.email, data))
}

/** @type {import('../bindings.js').AppHandler} */
export async function getOTP(c) {
  /** @type {import('micro-otp').OTPOpts} */
  const opts = {
    algorithm: 'sha1',
    digits: 6,
    interval: 30,
    secret: generateKey(),
  }
  const url = buildURL(opts)

  return c.json({
    url,
    qr: await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 5,
    }),
    secret: new URL(url).searchParams.get('secret'),
  })
}

/** @type {import('../bindings.js').AppHandler} */
export async function postOTP(c) {
  const session = c.get('session')
  const data = await c.req.json()
  const opts = parse(data.secret)
  const code = totp(opts)

  if (code === data.code) {
    const user = await c.get('users').put(session.user.email, { otp: true })
    await c.get('users').putOTP(session.user.email, data.secret)

    return c.json(user)
  }

  return c.json(
    {
      error: 'codes dont match',
    },
    400
  )
}

/** @type {import('../bindings.js').AppHandler} */
export async function checkOTP(c) {
  const session = c.get('session')
  const data = await c.req.json()
  const url = await c.get('users').getOTP(session.user.email)
  if (!url) {
    return c.json(
      {
        error: 'no session',
      },
      400
    )
  }
  const opts = parse(url)
  const code = totp(opts)

  if (code === data.code) {
    session.user = { email: session.user.email, isLoggedIn: true, otp: true }
    await session.save()
    return c.json(await c.get('users').get(session.user.email))
  }

  return c.json(
    {
      error: 'code dont match',
    },
    400
  )
}
