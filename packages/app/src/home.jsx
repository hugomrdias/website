import { route } from 'preact-router'
import useUser from './libs/use-user.js'
import { post } from './libs/utils.js'
/**
 * @param {import('preact').Attributes} props
 */
export default function Home(props) {
  const { user, mutateUser } = useUser({
    redirectTo: '/login',
  })

  return (
    <div path="/">
      <h1 className="Home-title">HD App</h1>
      <a href="/share?text=https://www.jasnell.me/">Share</a>
      {user && (
        <>
          <p>Hello, {user.email}</p>
          <button
            type="button"
            onClick={async () => {
              mutateUser(post('/api/logout', {}), false)
              route('/login')
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  )
}
