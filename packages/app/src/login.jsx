import { useState } from 'preact/hooks'
import useUser from './libs/use-user.js'
import { FetchError, post } from './libs/utils.js'

/**
 * @param {import('preact').Attributes} props
 */
export default function Login(props) {
  useUser({
    redirectTo: '/',
    redirectIfFound: true,
  })

  const [errorMsg, setErrorMsg] = useState('')

  /**
   *
   * @param {SubmitEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const body = {
      // @ts-ignore
      email: event.currentTarget?.username.value,
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

function Form({ errorMessage, onSubmit }) {
  return (
    <form onSubmit={onSubmit} autoComplete="on">
      <label>
        <span>Type your email</span>
        <input
          type="email"
          name="username"
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
