import { route } from 'preact-router'
import { useEffect } from 'preact/hooks'
import useSWR from 'swr'
import { get } from './utils.js'

export default function useUser({
  redirectTo = '',
  redirectIfFound = false,
} = {}) {
  /** @type {import('swr').SWRResponse<import('../types.js').User, import('./utils').FetchError>} */
  const swr = useSWR('/api/user', get)
  const { data: user, mutate: mutateUser, error, isValidating } = swr

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || isValidating) return

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && error) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user?.email)
    ) {
      route(redirectTo, true)
    }
  }, [user, redirectIfFound, redirectTo, error, isValidating])

  return { user, mutateUser }
}
