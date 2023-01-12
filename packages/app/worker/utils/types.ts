// Google Sign In
export interface Certificates {
  [index: string]: JwkCertificate
}

export interface JwkCertificate {
  kty: string
  alg: string
  use?: string
  kid: string
  n: string
  e: string
}

// PASSKEYS
/**
 * A super class of TypeScript's `AuthenticatorTransport` that includes support for the latest
 * transports. Should eventually be replaced by TypeScript's when TypeScript gets updated to
 * know about it (sometime after 4.6.3)
 */
export type AuthenticatorTransportFuture =
  | 'ble'
  | 'internal'
  | 'nfc'
  | 'usb'
  | 'cable'
  | 'hybrid'

/**
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentityjson
 */
export interface PublicKeyCredentialUserEntityJSON {
  id: string
  name: string
  displayName: string
}

/**
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptorjson
 */
export interface PublicKeyCredentialDescriptorJSON {
  id: Base64URLString
  type: PublicKeyCredentialType
  transports?: AuthenticatorTransportFuture[]
}

/**
 * An attempt to communicate that this isn't just any string, but a Base64URL-encoded string
 */
export type Base64URLString = string

/**
 * A variant of PublicKeyCredentialCreationOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.create(...) in the browser.
 *
 * This should eventually get replaced with official TypeScript DOM types when WebAuthn L3 types
 * eventually make it into the language:
 *
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson
 */
export interface PublicKeyCredentialCreationOptionsJSON {
  /**
   * This stands for “relying party”; it can be considered as describing the organization responsible for registering and authenticating the user.  [Read the spec](https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-rp).
   *
   * @param id - The id must be a subset of the domain currently in the browser. For example, for `https://login.example.com:1337` a valid id would be `login.example.com` or `example.com` to enable for all subdomains.
   * @param name - User-visible, "friendly" website/service name
   */
  rp: PublicKeyCredentialRpEntity
  /**
   * This is information about the user currently registering. The authenticator uses the id to associate a credential with the user. It is suggested to not use personally identifying information as the id, as it may be stored in an authenticator. [Read the spec](https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-user).
   *
   * @param id - A user's unique ID. This value must be an ArrayBuffer which does not include personally identifying information, for example, e-mail addresses or usernames. A random, 16-byte value generated per account will work well.
   * @param name - This field should hold a unique identifier for the account that the user will recognise, like their email address or username. This will be displayed in the account selector. (If using a username, use the same value as in password authentication.)
   * @param displayName - This field is an optional, more user-friendly name for the account. It need not be unique and could be the user's chosen name. If your site does not have a suitable value to include here, pass an empty string. This may be displayed on the account selector depending on the browser.
   */
  user: PublicKeyCredentialUserEntityJSON
  /**
   * The challenge is a buffer of cryptographically random bytes generated on the server, and is needed to prevent "replay attacks". [Read the spec](https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-challenge).
   *
   * Base64URL encoded
   */
  challenge: Base64URLString
  /**
   * This is an array of objects describing what public key types are acceptable to a server. The alg is a number described in the [COSE](https://www.iana.org/assignments/cose/cose.xhtml#algorithms) registry; for example, -7 indicates that the server accepts Elliptic Curve public keys using a SHA-256 signature algorithm. [Read the spec](https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-pubkeycredparams).
   */
  pubKeyCredParams: PublicKeyCredentialParameters[]
  /**
   * How long (in ms) the user can take to complete attestation. [Read the spec][https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-timeout]
   */
  timeout?: number
  /**
   * Prevents registering the same device by providing a list of already registered credential IDs. The [`transports`](https://w3c.github.io/webauthn/#dom-publickeycredentialdescriptor-transports) member, if provided, should contain the result of calling [`getTransports()`](https://w3c.github.io/webauthn/#dom-authenticatorattestationresponse-gettransports) during the registration of each credential.
   */
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[]
  /**
   * This optional object helps relying parties make further restrictions on the type of authenticators allowed for registration. [Read the spec](https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-authenticatorselection).
   */
  authenticatorSelection?: AuthenticatorSelectionCriteria
  /**
   * The attestation data that is returned from the authenticator has information that could be used to track users. This option allows servers to indicate how important the attestation data is to this registration event. A value of "none" indicates that the server does not care about attestation. A value of "indirect" means that the server will allow for anonymized attestation data. direct means that the server wishes to receive the attestation data from the authenticator. [Read the spec](https://w3c.github.io/webauthn/#attestation-conveyance).
   */
  attestation?: AttestationConveyancePreference
  extensions?: AuthenticationExtensionsClientInputs
}

/**
 * The value returned from navigator.credentials.create()
 */
export interface RegistrationCredential extends PublicKeyCredential {
  response: AuthenticatorAttestationResponse
  type: PublicKeyCredentialType
}

/**
 * A slightly-modified AuthenticatorAttestationResponse to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticatorattestationresponsejson
 */
export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: Base64URLString
  attestationObject: Base64URLString
  // Optional in L2, but becomes required in L3. Play it safe until L3 becomes Recommendation
  transports?: AuthenticatorTransportFuture[]
}

/**
 * A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-registrationresponsejson
 */
export interface RegistrationResponseJSON {
  id: Base64URLString
  rawId: Base64URLString
  response: AuthenticatorAttestationResponseJSON
  authenticatorAttachment?: AuthenticatorAttachment
  clientExtensionResults: AuthenticationExtensionsClientOutputs
  type: PublicKeyCredentialType
}

export interface ClientDataJSON {
  type: string
  challenge: string
  origin: string
  crossOrigin?: boolean
  tokenBinding?: {
    id?: string
    status: 'present' | 'supported' | 'not-supported'
  }
}

// COSE

/**
 * COSE Keys
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#key-common-parameters
 * https://www.iana.org/assignments/cose/cose.xhtml#key-type-parameters
 */
export enum COSEKEYS {
  kty = 1,
  alg = 3,
  crv = -1,
  x = -2,
  y = -3,
  n = -1,
  e = -2,
}

/**
 * COSE Key Types
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#key-type
 */
export enum COSEKTY {
  OKP = 1,
  EC2 = 2,
  RSA = 3,
}

/**
 * COSE Curves
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#elliptic-curves
 */
export enum COSECRV {
  P256 = 1,
  P384 = 2,
  P521 = 3,
  ED25519 = 6,
}

/**
 * COSE Algorithms
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export enum COSEALG {
  ES256 = -7,
  EdDSA = -8,
  ES384 = -35,
  ES512 = -36,
  PS256 = -37,
  PS384 = -38,
  PS512 = -39,
  ES256K = -47,
  RS256 = -257,
  RS384 = -258,
  RS512 = -259,
  RS1 = -65_535,
}

export interface COSEPublicKey {
  1: COSEKTY
  3: COSEALG
}

export interface COSEPublicKeyOKP extends COSEPublicKey {
  '-1': COSECRV
  '-2': Uint8Array
}

export interface COSEPublicKeyEC2 extends COSEPublicKey {
  '-1': COSECRV
  '-2': Uint8Array
  '-3': Uint8Array
}

export interface COSEPublicKeyRSA extends COSEPublicKey {
  '-1': Uint8Array
  '-2': Uint8Array
}
