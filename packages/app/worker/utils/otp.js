export function generateKey(length = 64) {
  const bytes = new Uint8Array(length)
  const key = crypto.getRandomValues(bytes)
  return key
}
