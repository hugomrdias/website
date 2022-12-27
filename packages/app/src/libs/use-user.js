import { route } from 'preact-router'
import { useEffect } from 'preact/hooks'
import useSWR from 'swr'
import { get } from './utils.js'

export default function useUser({
  redirectTo = '',
  redirectIfFound = false,
} = {}) {
  const { data: user, mutate: mutateUser } = useSWR('/api/user', get)

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user?.isLoggedIn)
    ) {
      route(redirectTo, true)
    }
  }, [user, redirectIfFound, redirectTo])

  return { user, mutateUser }
}
