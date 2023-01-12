import { base64url, utf8 } from 'iso-base'

export async function supportsPasskeys() {
  if (
    globalThis.PublicKeyCredential &&
    typeof globalThis.PublicKeyCredential === 'function' &&
    'isUserVerifyingPlatformAuthenticatorAvailable' in
      globalThis.PublicKeyCredential &&
    'isConditionalMediationAvailable' in globalThis.PublicKeyCredential
  ) {
    // Check if user verifying platform authenticator is available.
    return Promise.all([
      globalThis.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      // @ts-expect-error TS needs to update dom types
      globalThis.PublicKeyCredential.isConditionalMediationAvailable(),
    ]).then((results) => {
      if (results.every((r) => r === true)) {
        return true
      }
      return false
    })
  }

  return false
}

/**
 *
 * @param {import('../../worker/utils/types').PublicKeyCredentialDescriptorJSON} descriptor
 * @returns {PublicKeyCredentialDescriptor}
 */
export function toPublicKeyCredentialDescriptor(descriptor) {
  const { id, transports } = descriptor

  return {
    ...descriptor,
    id: base64url.decode(id),
    /**
     * `descriptor.transports` is an array of our `AuthenticatorTransport` that includes newer
     * transports that TypeScript's DOM lib is ignorant of. Convince TS that our list of transports
     * are fine to pass to WebAuthn since browsers will recognize the new value.
     */
    transports,
  }
}

/**
 * @param {string | null} attachment
 */
function toAuthenticatorAttachment(attachment) {
  if (!attachment) {
    return
  }

  if (!['cross-platform', 'platform'].includes(attachment)) {
    return
  }

  return /** @type {AuthenticatorAttachment} */ (attachment)
}

/**
 * A way to cancel an existing WebAuthn request, for example to cancel a
 * WebAuthn autofill authentication request for a manual authentication attempt.
 */
class AbortService {
  /** @type {AbortController | undefined} */
  #controller

  /**
   * Prepare an abort signal that will help support multiple auth attempts without needing to
   * reload the page
   */
  createSignal() {
    // Abort any existing calls to navigator.credentials.create() or navigator.credentials.get()
    if (this.#controller) {
      this.#controller.abort(
        'Cancelling existing WebAuthn API call for new one'
      )
    }

    const newController = new AbortController()

    this.#controller = newController
    return newController.signal
  }
}

const abortService = new AbortService()

/**
 * @param {import("../../worker/utils/types").PublicKeyCredentialCreationOptionsJSON} opts
 * @returns {Promise<import('../../worker/utils/types').RegistrationResponseJSON>}
 */
export async function credentialsCreate(opts) {
  if (!(await supportsPasskeys())) {
    throw new Error('Passkeys not supported')
  }

  // Convert base64 encoded options to bytes for `navigator.credentials.create`
  const publicKey = {
    ...opts,
    challenge: base64url.decode(opts.challenge),
    user: {
      ...opts.user,
      id: utf8.decode(opts.user.id),
    },
    excludeCredentials: opts.excludeCredentials?.map(
      toPublicKeyCredentialDescriptor
    ),
  }

  let credential
  try {
    credential =
      /** @type {import('../../worker/utils/types').RegistrationCredential} */ (
        await navigator.credentials.create({
          publicKey,
          signal: abortService.createSignal(),
        })
      )
  } catch (error) {
    console.log('Credentials create failed', error)
  }

  if (!credential) {
    throw new Error('Registration was not completed')
  }

  const { id, rawId, response, type, authenticatorAttachment } = credential

  return {
    id,
    rawId: base64url.encode(new Uint8Array(rawId)),
    type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: toAuthenticatorAttachment(authenticatorAttachment),
    response: {
      clientDataJSON: base64url.encode(new Uint8Array(response.clientDataJSON)),
      attestationObject: base64url.encode(
        new Uint8Array(response.attestationObject)
      ),
      transports:
        /** @type {import('../../worker/utils/types').AuthenticatorTransportFuture[]} */ (
          response.getTransports()
        ),
    },
  }
}

export async function credentialsGet(challenge) {
  const credential = await navigator.credentials.get({
    mediation: 'conditional',
    signal: abortService.createSignal(),
    publicKey: {
      allowCredentials: [],
      challenge: base64url.decode(challenge),
    },
  })

  if (!credential) {
    throw new Error('credential failed')
  }

  const { id, rawId, response, type } =
    /** @type {import('../../worker/utils/passkeys/types.js').AuthenticationCredential} */ (
      credential
    )

  let userHandle
  if (response.userHandle) {
    userHandle = base64url.encode(new Uint8Array(response.userHandle))
  }

  return {
    id,
    rawId: base64url.encode(new Uint8Array(rawId)),
    response: {
      authenticatorData: base64url.encode(
        new Uint8Array(response.authenticatorData)
      ),
      clientDataJSON: base64url.encode(new Uint8Array(response.clientDataJSON)),
      signature: base64url.encode(new Uint8Array(response.signature)),
      userHandle,
    },
    type,
  }
}
