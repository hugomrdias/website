import { useEffect, useRef, useState } from 'preact/hooks'

/**
 * @param {(()=> void)} fn
 */
export function useOnload(fn) {
  const loaded = useRef(false)
  // This will run one time after the component mounts
  useEffect(() => {
    const onPageLoad = () => {
      loaded.current = true
      fn()
    }
    // Check if the page has already loaded
    if (document.readyState === 'complete') {
      onPageLoad()
    } else {
      window.addEventListener('load', onPageLoad, { once: true })
    }
  }, [])

  return { loaded }
}

/**
 * @param {google.accounts.id.IdConfiguration} config
 * @param {boolean} [prompt]
 */
export function useGoogle(config, prompt = false) {
  /** @type {[undefined|google, import('preact/hooks').StateUpdater<undefined|google>]} */
  const [g, setGoogle] = useState(
    // eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
    globalThis.google ? globalThis.google : undefined
  )
  // This will run one time after the component mounts
  useOnload(() => {
    globalThis.google.accounts.id.initialize(config)

    if (prompt) {
      globalThis.google.accounts.id.prompt()
    }
    setGoogle(globalThis.google)
  })
  return { google: g }
}
