/**
 * @type {import('hono').MiddlewareHandler<string, any, any>}
 */
export async function auth(c, next) {
  const session = c.get('session')

  if (session.user && session.user.email && session.user.isLoggedIn) {
    await next()
  }

  return c.json(
    {
      error: 'no session',
    },
    401
  )
}
