import stream from 'node:stream'
/**
 *
 * @param {import('vite').Connect.IncomingMessage} req
 * @returns
 */
export function toRequest(req) {
  const ctrl = new AbortController()
  // @ts-ignore
  const headers = new Headers(req.headers)
  const url = `http://${headers.get('host')}${req.url}`

  req.once('aborted', () => ctrl.abort())

  return new Request(url, {
    // @ts-ignore
    headers,
    method: req.method,
    // @ts-ignore
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : stream.Readable.toWeb(req),
    signal: ctrl.signal,
    referrer: headers.get('referrer') || undefined,
  })
}

/**
 *
 * @param {Response} webRes
 * @param {import('node:http').ServerResponse<import('vite').Connect.IncomingMessage>} nodeRes
 */
export function fromResponse(webRes, nodeRes) {
  nodeRes.statusCode = webRes.status
  for (const [key, value] of webRes.headers) {
    if (key === 'set-cookie') {
      const setCookie = webRes.headers.get('set-cookie')
      if (setCookie) {
        nodeRes.setHeader('set-cookie', setCookie)
      }
    } else {
      nodeRes.setHeader(key, value)
    }
  }

  if (webRes.body) {
    // @ts-ignore
    stream.Readable.fromWeb(webRes.body).pipe(nodeRes, { end: true })
  } else {
    nodeRes.end()
  }
}
