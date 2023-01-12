import { Encoder, decode, encode } from 'cbor-x'
import { base64url, utf8 } from 'iso-base'

const encoder = new Encoder({
  mapsAsObjects: false,
  tagUint8Array: false,
})

/**
 * Decode and return the first item in a sequence of CBOR-encoded values
 *
 * @template Type
 * @param {Uint8Array} input - The CBOR data to decode
 * @returns {Type}
 */
export function stableDecode(input) {
  const decoded = encoder.decodeMultiple(input)

  if (decoded === undefined) {
    throw new Error('CBOR input data was empty')
  }

  const [first] = /** @type {[Type]} */ (/** @type {unknown} */ (decoded))

  return first
}

/**
 * Encode data to CBOR
 *
 * @param {any} input
 */
export function stableEncode(input) {
  return Uint8Array.from(encoder.encode(input))
}

export const cborStable = {
  decode: stableDecode,
  encode: stableEncode,
}

export const cbor = {
  decode,
  encode,
}

/**
 * @template Type
 * @param {string} data
 * @returns {Type}
 */
export function base64ToObject(data) {
  return /** @type {Type} */ (JSON.parse(utf8.encode(base64url.decode(data))))
}

/**
 * @template Type
 * @param {string} data
 * @returns {Type}
 */
export function base64CBORToObject(data) {
  return /** @type {Type} */ (cbor.decode(base64url.decode(data)))
}

/**
 *
 * @param {Uint8Array | string} data
 * @param {string} alg - web crypto hash algo
 */
export async function hash(data, alg = 'SHA-256') {
  if (typeof data === 'string') {
    data = utf8.decode(data)
  }

  return new Uint8Array(await crypto.subtle.digest(alg, data))
}

/**
 * Parse credential.response.getAuthenticatorData() return by navigator.credentials.create()
 *
 * @see https://w3c.github.io/webauthn/#sctn-authenticator-data
 *
 * @param {Uint8Array} data
 */
export function parseAuthenticatorData(data) {
  if (data.byteLength < 37) {
    throw new Error(
      `Authenticator data has ${data.byteLength} bytes, expected at least 37 bytes.`
    )
  }
  let pointer = 0

  const dataView = new DataView(data.buffer, data.byteOffset, data.length)
  const rpIdHash = data.slice(pointer, (pointer += 32))
  const flagsBytes = data.slice(pointer, (pointer += 1))
  const flagsInt = flagsBytes[0]

  // Bit positions can be referenced here:
  // https://www.w3.org/TR/webauthn-2/#flags
  const flags = {
    // eslint-disable-next-line unicorn/prefer-math-trunc
    up: Boolean(flagsInt & (1 << 0)), // User Presence
    uv: Boolean(flagsInt & (1 << 2)), // User Verified
    be: Boolean(flagsInt & (1 << 3)), // Backup Eligibility
    bs: Boolean(flagsInt & (1 << 4)), // Backup State
    at: Boolean(flagsInt & (1 << 6)), // Attested Credential Data Present
    ed: Boolean(flagsInt & (1 << 7)), // Extension Data Present
    flagsInt,
  }

  const signCountBytes = data.slice(pointer, pointer + 4)
  const signCount = dataView.getUint32(pointer, false)
  pointer += 4

  /** @type {Uint8Array | undefined} */
  let aaguid
  /** @type {Uint8Array | undefined} */
  let credentialID
  /** @type {Uint8Array | undefined} */
  let credentialPublicKeyBytes
  /** @type {import('../types').COSEPublicKey | undefined} */
  let credentialPublicKey

  if (flags.at) {
    aaguid = data.slice(pointer, (pointer += 16))

    const credIDLen = dataView.getUint16(pointer)
    pointer += 2

    credentialID = data.slice(pointer, (pointer += credIDLen))

    // Decode the next CBOR item in the buffer, then re-encode it back to a Buffer
    const bytes = data.slice(pointer)
    const firstDecoded = cborStable.decode(bytes)
    const firstEncoded = cborStable.encode(firstDecoded)

    credentialPublicKeyBytes = firstEncoded

    // TODO parse into a human readable json
    credentialPublicKey = cbor.decode(credentialPublicKeyBytes)

    pointer += firstEncoded.byteLength
  }

  let extensionsData
  let extensionsDataBytes

  if (flags.ed) {
    const firstDecoded = cborStable.decode(data.slice(pointer))
    extensionsDataBytes = cborStable.encode(firstDecoded)
    extensionsData = cbor.decode(extensionsDataBytes)
    pointer += extensionsDataBytes.byteLength
  }

  // Pointer should be at the end of the authenticator data, otherwise too much data was sent
  if (data.byteLength > pointer) {
    throw new Error('Leftover bytes detected while parsing authenticator data')
  }

  return {
    rpIdHash,
    flagsBuf: flagsBytes,
    flags,
    signCountBytes,
    signCount,
    aaguid,
    credentialID,
    credentialPublicKey,
    credentialPublicKeyBytes,
    extensionsData,
    extensionsDataBytes,
  }
}
