import { replaceDiacritics } from './diacritics.js'
import { en } from './stop-words.js'

/** https://lyrasearch.io/ */
const enRegex = /[^\w'-]+/gim

export const normalizationCache = new Map()

/**
 * @template T
 * @param {T[] | readonly T[]} array
 * @param {T} element
 * @returns
 */
export function includes(array, element) {
  for (const element_ of array) {
    if (element_ === element) {
      return true
    }
  }
  return false
}

/**
 *
 * @param {string[]} text
 * @returns string[]
 */
function trim(text) {
  while (text[text.length - 1] === '') {
    text.pop()
  }
  while (text[0] === '') {
    text.shift()
  }
  return text
}

/**
 *
 * @param {string} token
 * @param {import("./types").TokenizerConfig} tokenizerConfig
 */
function normalizeToken(token, tokenizerConfig) {
  const key = `${token}`

  if (normalizationCache.has(key)) {
    return normalizationCache.get(key)
  }

  // remove not word from begining and end
  token = token.replace(/^\W+/, '').replace(/\W+$/, '')

  // too small
  if (token.length <= 2) {
    const token = ''
    normalizationCache.set(key, token)
    return token
  }

  // Check if stop-words removal is enabled
  if (tokenizerConfig?.enableStopWords && includes(en, token)) {
    const token = ''
    normalizationCache.set(key, token)
    return token
  }

  // Check if stemming is enabled
  if (
    tokenizerConfig?.enableStemming &&
    typeof tokenizerConfig?.stemmingFn === 'function'
  ) {
    token = tokenizerConfig?.stemmingFn(token)
  }

  token = replaceDiacritics(token)
  normalizationCache.set(key, token)
  return token
}

/**
 *
 * @param {string} input
 * @param {import("./types").TokenizerConfig} tokenizerConfig
 * @param {boolean} [allowDuplicates]
 * @returns
 */
export function tokenize(input, tokenizerConfig, allowDuplicates = false) {
  /* c8 ignore next 3 */
  if (typeof input !== 'string') {
    return [input]
  }

  const splitRule = enRegex
  const tokens = input
    .toLowerCase()
    .split(splitRule)
    .map((token) => normalizeToken(token, tokenizerConfig))
    .filter(Boolean)

  const trimTokens = trim(tokens)

  if (!allowDuplicates) {
    return [...new Set(trimTokens)]
  }

  return trimTokens
}
