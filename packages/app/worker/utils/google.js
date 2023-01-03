import { base64url, utf8 } from 'iso-base'
const GOOGLE_OAUTH2_FEDERATED_SIGNON_JWK_CERTS_URL_ =
  'https://www.googleapis.com/oauth2/v3/certs'

const MAX_TOKEN_LIFETIME_SECS = 86_400
const CLOCK_SKEW_SECS = 300

const CLIENT_ID =
  '988377666163-om4unmof6tv868hhgpk5m31dtr2e74nb.apps.googleusercontent.com'

export async function getGoogleCerts() {
  const rsp = await fetch(GOOGLE_OAUTH2_FEDERATED_SIGNON_JWK_CERTS_URL_)
  const data = await rsp.json()

  /** @type {import("./types").Certificates} */
  const certificates = {}
  for (const key of data.keys) {
    certificates[key.kid] = key
  }

  // TODO add cache https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/oauth2client.ts#L1182-L1209

  return certificates
}

/**
 * @param {string} jwt
 * @param {import("./types").Certificates} certs
 * @param {string} [audience]
 * @param {string[]} [issuers] - The allowed issuers of the jwt (Optional).
 * @param {number} [maxExpiry] - The max expiry the certificate can be (Optional).
 */
export async function verifyToken(
  jwt,
  certs,
  audience = CLIENT_ID,
  issuers = ['https://accounts.google.com'],
  maxExpiry = MAX_TOKEN_LIFETIME_SECS
) {
  const { header, payload, signature, signed } = parseJWT(jwt)

  if (!header.kid) {
    throw new Error('No pem found for envelope: ' + JSON.stringify(header))
  }

  const cert = certs[header.kid]

  const verified = await verify(cert, signed, signature)

  if (!verified) {
    throw new Error('Invalid token signature: ' + jwt)
  }

  if (!payload.iat) {
    throw new Error('No issue time in token: ' + JSON.stringify(payload))
  }

  if (!payload.exp) {
    throw new Error('No expiration time in token: ' + JSON.stringify(payload))
  }

  const iat = Number(payload.iat)
  if (Number.isNaN(iat)) throw new Error('iat field using invalid format')

  const exp = Number(payload.exp)
  if (Number.isNaN(exp)) throw new Error('exp field using invalid format')

  const now = Date.now() / 1000

  if (exp >= now + maxExpiry) {
    throw new Error(
      'Expiration time too far in future: ' + JSON.stringify(payload)
    )
  }

  const earliest = iat - CLOCK_SKEW_SECS
  const latest = exp + CLOCK_SKEW_SECS

  if (now < earliest) {
    throw new Error(
      'Token used too early, ' +
        now +
        ' < ' +
        earliest +
        ': ' +
        JSON.stringify(payload)
    )
  }

  if (now > latest) {
    throw new Error(
      'Token used too late, ' +
        now +
        ' > ' +
        latest +
        ': ' +
        JSON.stringify(payload)
    )
  }

  if (issuers && !issuers.includes(payload.iss)) {
    throw new Error(
      'Invalid issuer, expected one of [' +
        issuers +
        '], but got ' +
        payload.iss
    )
  }

  // Check the audience matches if we have one
  if (audience) {
    const aud = payload.aud
    let audVerified = false
    // If the requiredAudience is an array, check if it contains token
    // audience
    audVerified = aud === audience
    if (!audVerified) {
      throw new Error('Wrong recipient, jwt audience does not match client ID.')
    }
  }

  return { header, payload }
}

/**
 *
 * @param {import("./types").JwkCertificate} pubkey
 * @param {string} data
 * @param {string} signature
 */
async function verify(pubkey, data, signature) {
  const algo = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: { name: 'SHA-256' },
  }
  const dataArray = utf8.decode(data)
  const signatureArray = base64url.decode(signature)
  const cryptoKey = await window.crypto.subtle.importKey(
    'jwk',
    pubkey,
    algo,
    true,
    ['verify']
  )

  // SubtleCrypto's verify method is async so we must make
  // this method async as well.
  const result = await window.crypto.subtle.verify(
    algo,
    cryptoKey,
    signatureArray,
    dataArray
  )
  return result
}

/**
 *
 * @param {string} str
 */
function base64ToJSON(str) {
  return JSON.parse(utf8.encode(base64url.decode(str)))
}

/**
 * @param {string} token
 */
export function parseJWT(token) {
  const segments = token.split('.')

  if (segments.length !== 3) {
    throw new Error('Wrong number of segments in token: ' + token)
  }

  let header
  let payload
  try {
    header = base64ToJSON(segments[0])
  } catch {
    throw new Error(`Can't parse token header '${segments[0]}`)
  }
  try {
    payload = base64ToJSON(segments[1])
  } catch {
    throw new Error(`Can't parse token payload '${segments[1]}`)
  }

  return {
    header,
    payload,
    signed: segments[0] + '.' + segments[1],
    signature: segments[2],
  }
}
