import { asUint8Array } from './rfc4648.js'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()
/**
 * @type {import("./types").Codec}
 */
export const utf8 = {
  encode(input) {
    if (typeof input === 'string') {
      return input
    }
    if (globalThis.Buffer) {
      return globalThis.Buffer.from(input).toString('utf8')
    }

    return textDecoder.decode(input)
  },
  decode(input) {
    if (input instanceof Uint8Array) {
      return input
    }
    if (globalThis.Buffer) {
      return asUint8Array(globalThis.Buffer.from(input, 'utf8'))
    }
    return textEncoder.encode(input)
  },
}
