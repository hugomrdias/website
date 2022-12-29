import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { getIronSession } from 'iron-session/edge'
import { subscribe } from './routes/feedbin.js'
import { getMeta, metaValidator } from './routes/get-meta.js'
import {
  checkOTP,
  getOTP,
  getUser,
  logout,
  postFinishLogin,
  postLogin,
  postOTP,
  postUser,
} from './routes/login.js'
import { bookmark } from './routes/ticktick.js'
// import { postTick } from './routes/post-tick.js'
import { Email } from './utils/email.js'
import { auth } from './utils/session.js'
import { Users } from './utils/users.js'

/** @type {import('./bindings').App} */
const app = new Hono()
app.notFound((c) => {
  return c.env.ENV === 'dev'
    ? new Response('', { headers: { 'x-skip-request': '' } })
    : c.env.ASSETS.fetch(c.req)
})

app.onError((c) => {
  // eslint-disable-next-line no-console
  console.error(c)

  return new Response(
    JSON.stringify({
      error: c.message,
      name: c.name,
    }),
    {
      status: 500,
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    }
  )
})

// app.use('*', logger())

app.use('*', async (c, next) => {
  const session = await getIronSession(c.req, c.res, {
    password: c.env.SESSION_SECRET,
    cookieName: 'hd-app',
    cookieOptions: {
      secure: c.env.ENV === 'production',
    },
  })

  c.set('session', session)
  await next()
})

app.use('*', async (c, next) => {
  c.set('url', new URL(c.req.url))
  c.set(
    'email',
    new Email({
      token: c.env.POSTMARK_TOKEN,
    })
  )
  c.set('users', new Users(c.env.USERS))
  await next()
})

app.get('/api', (c, next) => {
  return c.json(c.env)
})

app.post('/api/login', postLogin)
app.post('/api/finish-login', postFinishLogin)
app.post('/api/otp', checkOTP)
app.post('/api/logout', logout)
app.get('/api/user', auth, getUser)
app.post('/api/user', auth, postUser)
app.get('/api/user/otp', auth, getOTP)
app.post('/api/user/otp', auth, postOTP)
app.get('/api/meta', auth, metaValidator(), getMeta)

app.post('/api/subscribe', auth, subscribe)
app.post('/api/bookmark', auth, bookmark)

export default app
