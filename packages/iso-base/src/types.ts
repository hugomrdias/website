export interface Codec {
  /**
   * Encode bytes or utf8 string to string
   *
   * @param data - Data to be encoded to string
   * @param pad - Should have padding. Defaults: true
   */
  encode: (data: Uint8Array | string, pad?: boolean) => string
  decode: (data: string | Uint8Array) => Uint8Array
}
