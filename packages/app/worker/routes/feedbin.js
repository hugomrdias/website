/** @type {import('../bindings.js').AppHandler} */
export async function subscribe(c) {
  const session = c.get('session')
  const user = await c.get('users').get(session.user.email)
  const data = await c.req.json()
  const rsp = await fetch('https://api.feedbin.com/v2/subscriptions.json', {
    method: 'POST',
    body: JSON.stringify({
      feed_url: data.feed,
    }),
    headers: {
      'content-type': 'application/json; charset=utf-8',
      Authorization: `Basic ${user?.feedbin}`,
    },
  })

  if (rsp.ok) {
    return c.json({
      ok: true,
      data: await rsp.json(),
    })
  }

  const feedbin = await rsp.json()
  return c.json(
    {
      error: `Error subscribing ${feedbin.message || ''}`,
    },
    401
  )
}
