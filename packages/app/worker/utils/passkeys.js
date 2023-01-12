import { base64url } from 'iso-base'

/**
 * Generate a suitably random value to be used as an attestation or assertion challenge
 */
export function generateChallenge() {
  /**
   * WebAuthn spec says that 16 bytes is a good minimum:
   *
   * "In order to prevent replay attacks, the challenges MUST contain enough entropy to make
   * guessing them infeasible. Challenges SHOULD therefore be at least 16 bytes long."
   *
   * Just in case, let's double it
   */
  const challenge = new Uint8Array(32)

  crypto.getRandomValues(challenge)

  return challenge
}
/**
 * Supported crypto algo identifiers
 * See https://w3c.github.io/webauthn/#sctn-alg-identifier
 * and https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 *
 * @type {COSEAlgorithmIdentifier[]}
 */
export const supportedCOSEAlgorithmIdentifiers = [
  // EdDSA (In first position to encourage authenticators to use this over ES256)
  -8,
  // ECDSA w/ SHA-256
  -7,
  // ECDSA w/ SHA-512
  -36,
  // RSASSA-PSS w/ SHA-256
  -37,
  // RSASSA-PSS w/ SHA-384
  -38,
  // RSASSA-PSS w/ SHA-512
  -39,
  // RSASSA-PKCS1-v1_5 w/ SHA-256
  -257,
  // RSASSA-PKCS1-v1_5 w/ SHA-384
  -258,
  // RSASSA-PKCS1-v1_5 w/ SHA-512
  -259,
  // RSASSA-PKCS1-v1_5 w/ SHA-1 (Deprecated; here for legacy support)
  //   -65_535,
]

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {COSEAlgorithmIdentifier[]} [opts.supportedAlgorithmIDs] - Array of numeric COSE algorithm identifiers supported for attestation by this RP. See https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 * @param {number} [opts.timeout]
 * @param {import('./types').PublicKeyCredentialDescriptorJSON[]} [opts.excludeCredentials]
 * @returns {import("./types").PublicKeyCredentialCreationOptionsJSON}
 */
export function createPasskeyOptions(opts) {
  const {
    userId,
    supportedAlgorithmIDs = supportedCOSEAlgorithmIdentifiers,
    timeout = 60_000,
    excludeCredentials = [],
  } = opts

  /** @type {PublicKeyCredentialParameters[]} */
  const pubKeyCredParams = supportedAlgorithmIDs.map((id) => ({
    alg: id,
    type: 'public-key',
  }))

  return {
    challenge: base64url.encode(generateChallenge()),
    rp: {
      name: 'HD app',
      id: 'localhost',
    },
    user: {
      displayName: 'hugomrdias',
      id: userId,
      name: userId,
    },
    pubKeyCredParams,
    timeout,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      userVerification: 'required',
      residentKey: 'required',
    },
    extensions: {
      credProps: true,
    },
    excludeCredentials,
  }
}
