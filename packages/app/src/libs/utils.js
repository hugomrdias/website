/**
 * @param {any[]} args
 */
export async function fetcher(...args) {
  // @ts-ignore
  const res = await fetch(...args)
  return res.json()
}

/**
 * @param {string} url
 * @param {Record<string,string>} params
 */
export async function get(url, params) {
  const u = new URL(url, window.location.origin)
  u.search = new URLSearchParams(params).toString()

  const res = await fetch(u)

  if (!res.ok) {
    const data = await res.json()
    throw new FetchError('API error', data.error.message, res.status)
  }

  return res.json()
}

/**
 * @param {string} url
 * @param {Record<string,any>} body
 */
export async function post(url, body) {
  const u = new URL(url, window.location.origin)

  const res = await fetch(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new FetchError('API error', data.error.message, res.status)
  }

  return res.json()
}

export class FetchError extends Error {
  /**
   * @param {string} msg
   * @param {any} info
   * @param {number} status
   */
  constructor(msg, info, status) {
    super(msg)
    this.info = info
    this.status = status
  }
}
