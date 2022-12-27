import { useEffect } from 'preact/hooks'
import useUser from './libs/use-user.js'
import { post } from './libs/utils.js'

/**
 * @param {import('preact').Attributes} props
 */
export default function Callback(props) {
  const { mutateUser } = useUser({
    redirectTo: '/',
    redirectIfFound: true,
  })
  const parsedUrl = new URL(window.location.href)

  useEffect(() => {
    async function finishLogin() {
      const user = await post('/api/finish-login', {
        seal: parsedUrl.searchParams.get('seal'),
      })
      mutateUser(user, false)
    }

    finishLogin()
  })

  return <></>
}
