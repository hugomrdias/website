import { Base64URLString, PublicKeyCredentialDescriptorJSON } from '../types.js'

export type AttestationFormat =
  | 'fido-u2f'
  | 'packed'
  | 'android-safetynet'
  | 'android-key'
  | 'tpm'
  | 'apple'
  | 'none'

/**
 * `AttestationStatement` will be an instance of `Map`, but these keys help make finite the list of
 * possible values within it.
 */
export interface AttestationStatement {
  sig: Uint8Array | undefined
  x5c: Uint8Array[] | undefined
  response: Uint8Array | undefined
  alg: number | undefined
  ver: string | undefined
  certInfo: Uint8Array | undefined
  pubArea: Uint8Array | undefined
}

export interface AttestationObject {
  fmt: AttestationFormat
  attStmt: AttestationStatement
  authData: Uint8Array
}

/**
 * A variant of PublicKeyCredentialRequestOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.get(...) in the browser.
 */
export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: Base64URLString
  timeout?: number
  rpId?: string
  allowCredentials?: PublicKeyCredentialDescriptorJSON[]
  userVerification?: UserVerificationRequirement
  extensions?: AuthenticationExtensionsClientInputs
}

/**
 * The value returned from navigator.credentials.get()
 */
export interface AuthenticationCredential extends PublicKeyCredential {
  response: AuthenticatorAssertionResponse
}
