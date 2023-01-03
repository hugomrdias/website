import { route } from 'preact-router'
import { useState } from 'preact/hooks'
import { useForm } from 'react-hook-form'
import { Footer, TopBar } from './app.jsx'
import useUser from './libs/use-user.js'
import { get, post } from './libs/utils.js'

/**
 * @param {import('preact').Attributes} props
 */
export default function Home(props) {
  const [isSaving, setIsSaving] = useState(false)
  const { user, mutateUser } = useUser({
    redirectTo: '/login',
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    values: user,
  })
  const onSubmit = async (/** @type {Record<string, any>} */ data) => {
    setIsSaving(true)
    const out = await post('/api/user', data)
    mutateUser(out, false)
    setIsSaving(false)
  }

  return (
    <>
      <TopBar user={user} title="Home" />
      <div>
        <h2>Settings</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label for="email">Name:</label>
          <input id="email" {...register('email')} disabled />

          <label for="feedbin">Feebin:</label>
          <input id="feedbin" {...register('feedbin')} />

          <label for="tick-project">TickTick Project:</label>
          <input id="tick-project" {...register('tickProject')} />

          <label for="tick">TickTick Cookie: </label>
          <textarea
            id="tick"
            type="text"
            placeholder="copy/paste ticktick cookie here"
            {...register('tick', { required: true })}
          />
          {errors.tick && <p>This field is required</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </form>
        <OTP user={user} mutateUser={mutateUser} />
        <h2>Account</h2>
        <button
          type="button"
          onClick={async () => {
            // @ts-ignore
            // eslint-disable-next-line no-undef
            google.accounts.id.revoke(user?.email, (done) => {
              console.log('consent revoked')
            })
            await post('/api/logout')
            mutateUser(undefined, false)
            route('/login')
          }}
        >
          Logout
        </button>
      </div>
      <Footer />
    </>
  )
}

/**
 *
 * @param {object} props
 * @param {import('./types.js').User} [props.user]
 * @param {import('swr').KeyedMutator<import('./types.js').User> } props.mutateUser
 */
function OTP({ user, mutateUser }) {
  const [otp, setOTP] = useState({
    qr: '',
    secret: '',
    url: '',
  })

  /**
   * @param {SubmitEvent} e
   */
  async function onSubmit(e) {
    e.preventDefault()

    const user = await post(
      '/api/user/otp',
      // @ts-ignore
      Object.fromEntries(new FormData(e.currentTarget))
    )
    mutateUser(user, false)
    setOTP({
      qr: '',
      secret: '',
      url: '',
    })
  }
  return (
    <>
      <h2>OTP</h2>
      {!otp.qr ? (
        <button
          type="button"
          onClick={async () => {
            const data = await get('/api/user/otp')
            setOTP(data)
          }}
        >
          {user?.otp === true ? 'Reconfigure' : 'Enable'}
        </button>
      ) : (
        <>
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: otp.qr,
            }}
            class="mcenter"
            style={{
              width: '300px',
            }}
          />
          <form
            // @ts-ignore
            onSubmit={onSubmit}
          >
            <label for="secret">Secret:</label>
            <textarea name="secret" type="text" value={otp.url} />

            <label for="code">Code:</label>
            <input name="code" />
            <button type="submit">Save</button>
          </form>
        </>
      )}
    </>
  )
}
