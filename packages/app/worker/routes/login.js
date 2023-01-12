import { sealData, unsealData } from 'iron-session/edge'
import { buildURL, parse, totp } from 'micro-otp'
import { generateKey } from '../utils/otp.js'
import QRCode from 'qrcode'
import { getGoogleCerts, verifyToken } from '../utils/google.js'
import { createPasskeyOptions, generateChallenge } from '../utils/passkeys.js'
import { base64url, utf8 } from 'iso-base'
import {
  base64CBORToObject,
  base64ToObject,
  hash,
  parseAuthenticatorData,
} from '../utils/passkeys/encoding.js'

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
export async function validateEmail(c) {
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
export async function validateGoogle(c) {
  const { token } = await c.req.json()
  const session = c.get('session')

  try {
    const { payload } = await verifyToken(token, await getGoogleCerts())
    const user = await c
      .get('users')
      .getOrCreate(/** @type {string} */ (payload.email))

    await c.get('users').put(payload.email, { google: payload })

    const out = { email: user.email, isLoggedIn: false, otp: false }

    if (user.otp) {
      out.otp = true
    } else {
      out.isLoggedIn = true
    }

    session.user = out
    await session.save()
    return c.json(out)
  } catch (error) {
    return c.json({
      error: 'Failed google sign in validation.',
      // @ts-ignore
      message: error.message,
    })
  }
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
export async function revoke(c) {
  const session = c.get('session')
  const user = await c
    .get('users')
    .put(session.user.email, { google: undefined })
  return c.json(user)
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
export async function validateOTP(c) {
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
      error: 'codes dont match',
    },
    400
  )
}

/** @type {import('../bindings.js').AppHandler} */
export async function registerPasskey(c) {
  const data = await c.req.json()
  const session = c.get('session')

  const user = await c.get('users').get(data.username)

  /** @type {import('../utils/types.js').PublicKeyCredentialDescriptorJSON[]} */
  const excludeCredentials = []

  if (user) {
    excludeCredentials.push({
      id: user.passkey.id,
      type: 'public-key',
      transports: user.passkey.transports,
    })
  }
  const opts = createPasskeyOptions({
    userId: data.username,
    supportedAlgorithmIDs: [-8, -7, -257],
    excludeCredentials,
  })
  const out = {
    email: data.username,
    isLoggedIn: false,
    otp: false,
    challenge: opts.challenge,
  }

  session.user = out
  await session.save()
  return c.json(opts)
}

/** @type {import('../bindings.js').AppHandler} */
export async function registerVerifyPasskey(c) {
  const data =
    /** @type {import('../utils/types.js').RegistrationResponseJSON} */ (
      await c.req.json()
    )
  const session = c.get('session')
  console.log(
    '🚀 ~ file: login.js:227 ~ registerVerifyPasskey ~ session',
    session
  )

  const expectedChallenge = session.user.challenge
  const rpID = 'localhost'
  const expectedOrigin = `https://${rpID}`

  const {
    id,
    rawId,
    type,
    response,
    clientExtensionResults,
    authenticatorAttachment,
  } = data

  const { clientDataJSON, transports, attestationObject } = response

  /** @type {import('../utils/types.js').ClientDataJSON} */
  const parsedClientData = base64ToObject(clientDataJSON)

  if (expectedChallenge !== parsedClientData.challenge) {
    throw new Error('challenge dont match')
  }

  /** @type {import('../utils/passkeys/types.js').AttestationObject} */
  const parsedAttestation = base64CBORToObject(attestationObject)

  const { attStmt, authData, fmt } = parsedAttestation

  const { credentialID, rpIdHash, credentialPublicKeyBytes, signCount } =
    parseAuthenticatorData(authData)

  if (
    base64url.encode(await hash(utf8.decode(rpID))) !==
    base64url.encode(rpIdHash)
  ) {
    throw new Error('RP dont match')
  }

  const user = await c
    .get('users')
    .getOrCreate(/** @type {string} */ (session.user.email))

  await c.get('users').put(session.user.email, {
    passkey: {
      id: base64url.encode(credentialID),
      counter: signCount,
      publicKey: base64url.encode(credentialPublicKeyBytes),
      transports,
      type,
    },
  })

  const out = { email: session.user.email, isLoggedIn: true, otp: false }
  session.user = out
  await session.save()
  return c.json(out)
}

/** @type {import('../bindings.js').AppHandler} */
export async function tempPasskey(c) {
  const session = c.get('session')

  const challenge = base64url.encode(generateChallenge())
  const out = {
    email: '',
    isLoggedIn: false,
    otp: false,
    challenge,
  }

  session.user = out
  await session.save()
  return c.json({
    challenge,
  })
}

/** @type {import('../bindings.js').AppHandler} */
export async function authVerifyPasskey(c) {
  const data =
    /** @type {import('../utils/types.js').RegistrationResponseJSON} */ (
      await c.req.json()
    )
  const session = c.get('session')
  const expectedChallenge = session.user.challenge
  const rpID = 'localhost'
  const expectedOrigin = `https://${rpID}`

  const {
    id,
    rawId,
    type,
    response,
    clientExtensionResults,
    authenticatorAttachment,
  } = data

  const { clientDataJSON, transports, authenticatorData, userHandle } = response

  /** @type {import('../utils/types.js').ClientDataJSON} */
  const parsedClientData = base64ToObject(clientDataJSON)

  if (expectedChallenge !== parsedClientData.challenge) {
    throw new Error('challenge dont match')
  }

  // const { credentialID, rpIdHash, credentialPublicKeyBytes, signCount } =
  //   parseAuthenticatorData(authenticatorData)

  // if (
  //   base64url.encode(await hash(utf8.decode(rpID))) !==
  //   base64url.encode(rpIdHash)
  // ) {
  //   throw new Error('RP dont match')
  // }

  const username = utf8.encode(base64url.decode(userHandle))

  const user = await c
    .get('users')
    .getOrCreate(/** @type {string} */ (username))

  const out = { email: username, isLoggedIn: true, otp: false }
  session.user = out
  await session.save()
  return c.json(user)
}
