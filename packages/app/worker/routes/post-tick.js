import { JSONResponse } from '@web3-storage/worker-utils/response'

/**
 * @param {import('@web3-storage/worker-utils/router').ParsedRequest} request
 * @param {import('../bindings.js').RouteContext} env
 */
export async function postTick(request, env) {
  const data = await request.json()

  const rsp = await fetch('https://api.ticktick.com/api/v2/batch/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: data.cookie,
    },
    body: JSON.stringify({
      add: [
        {
          projectId: '5eca47948f08cb36da9648c8',
          id: '1',
          kind: 'NOTE',
          title: `[${data.title}](${data.url})`,
          content: `![image](${data.image})\n\n ${data.description}`,
          timeZone: 'Europe/Lisbon',
          imgMode: 1,
          tags: data.tags,
        },
      ],
    }),
  })

  return new JSONResponse({ ok: await rsp.text() })
}
