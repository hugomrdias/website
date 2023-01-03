import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import useUser from './libs/use-user.js'
import { FetchError, post } from './libs/utils.js'

/**
 * @param {import('preact').Attributes} props
 */
export default function Login(props) {
  const { mutateUser } = useUser({
    redirectTo: '/',
    redirectIfFound: true,
  })

  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function run() {
      if (globalThis.google) {
        globalThis.google.accounts.id.initialize({
          client_id:
            '988377666163-om4unmof6tv868hhgpk5m31dtr2e74nb.apps.googleusercontent.com',
          callback: async (credentialResponse) => {
            const data = await post('/api/validate', {
              token: credentialResponse.credential,
            })

            if (data.otp) {
              route('/otp', true)
            } else {
              mutateUser()
            }
          },
        })
        globalThis.google.accounts.id.prompt()
      }
    }

    run()
  }, [mutateUser])

  /**
   * @type {import('preact').JSX.GenericEventHandler<HTMLFormElement>}
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const body = {
      // @ts-ignore
      email: event.currentTarget?.email.value,
    }

    try {
      await post('/api/login', body)
    } catch (error) {
      if (error instanceof FetchError) {
        setErrorMsg(error.info)
      } else {
        // eslint-disable-next-line no-console
        console.error('An unexpected error happened:', error)
      }
    }
  }

  return (
    <>
      <div className="login">
        <Form errorMessage={errorMsg} onSubmit={handleSubmit} />
      </div>

      <style jsx>{`
        .login {
          max-width: 21rem;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </>
  )
}

/**
 *
 * @param {object} props
 * @param {string} props.errorMessage
 * @param {import('preact').JSX.GenericEventHandler<HTMLFormElement>} props.onSubmit
 */
function Form({ errorMessage, onSubmit }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on">
      <label>
        <span>Type your email</span>
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="john@gmail.com"
          autoComplete="email"
        />
      </label>

      <button type="submit">Login</button>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <style jsx>{`
        form,
        label {
          display: flex;
          flex-flow: column;
        }
        label > span {
          font-weight: 600;
        }
        input {
          padding: 8px;
          margin: 0.3rem 0 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .error {
          color: brown;
          margin: 1rem 0 0;
        }
      `}</style>
    </form>
  )
}
