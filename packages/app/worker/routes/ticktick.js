/** @type {import('../bindings.js').AppHandler} */
export async function bookmark(c) {
  const session = c.get('session')
  const user = await c.get('users').get(session.user.email)
  const data = await c.req.json()

  const tick = fetch('https://api.ticktick.com/api/v2/batch/task', {
    method: 'POST',
    // @ts-ignore
    headers: {
      'Content-Type': 'application/json',
      Cookie: user?.tick,
    },
    body: JSON.stringify({
      add: [
        {
          projectId: user?.tickProject,
          id: '1',
          kind: 'NOTE',
          title: `[${data.title}](${data.url})`,
          content: `![image](${data.image})\n\n ${data.description}\n\n ${data.content}`,
          timeZone: 'Europe/Lisbon',
          imgMode: 1,
          tags: data.tags,
        },
      ],
    }),
  })

  const feedbin = fetch('https://api.feedbin.com/v2/pages.json', {
    method: 'POST',
    body: JSON.stringify({
      url: data.url,
    }),
    headers: {
      'content-type': 'application/json; charset=utf-8',
      Authorization: `Basic ${user?.feedbin}`,
    },
  })

  const all = await Promise.all([tick, feedbin])

  return c.json({
    ok: true,
    tick: await all[0].json(),
    feedbin: await all[1].json(),
  })
}
