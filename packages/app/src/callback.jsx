import { useEffect } from 'preact/hooks'
import useUser from './libs/use-user.js'
import { post } from './libs/utils.js'
import { route } from 'preact-router'

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
      const data = await post('/api/validate-email', {
        seal: parsedUrl.searchParams.get('seal'),
      })

      if (data.otp) {
        route('/otp', true)
      } else {
        mutateUser()
      }
    }

    finishLogin()
  })

  return <></>
}
