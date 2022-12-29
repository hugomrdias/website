// @ts-ignore
import { parseHTML } from 'linkedom/worker'
import { Readability } from '@mozilla/readability'

const parseLinkedom = /** @type {(html:any) => Window & typeof globalThis} */ (
  parseHTML
)

/**
 * @param {URL} url
 * @param {RequestInit} [requestOptions]
 */
export async function parse(url, requestOptions) {
  const rsp = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
    },
  })

  if (!rsp.ok) {
    throw new Error(`Failed to fetch ${url.toString()}`)
  }

  const raw = await rsp.text()
  const { document } = parseLinkedom(raw)

  const meta = getMeta(document, url)

  const reader = new Readability(document, {
    classesToPreserve: ['highlight', 'hljs'],
    keepClasses: true,
    serializer: (el) => el,
  })
  const article = reader.parse()
  const node = /** @type {HTMLElement} */ (article?.content)

  // post process
  if (node) {
    const images = [...node.querySelectorAll('img')]
    for (const img of images) {
      const src = /** @type {string} */ (img.getAttribute('src'))
      img.setAttribute(
        'src',
        new URL(
          src || '',
          src.startsWith('/') ? url.origin : url.href
        ).toString()
      )
    }

    const anchors = [...node.querySelectorAll('a')]
    for (const anchor of anchors) {
      const src = /** @type {string} */ (anchor.getAttribute('href'))
      anchor.setAttribute(
        'href',
        new URL(
          src || '',
          src.startsWith('/') ? url.origin : url.href
        ).toString()
      )
    }
  }

  return { raw: node.innerHTML, meta }
}

/**
 * TODO: add more from here https://github.com/gorango/rehype-extract-meta/blob/main/lib/candidates.js
 *
 * @param {Document} document
 * @param {URL} url
 */
function getMeta(document, url) {
  /** @type {import('./types').Metadata} */
  const meta = {
    title: undefined,
    image: undefined,
    description: undefined,
    feeds: undefined,
  }

  // title
  if (!meta.title) {
    meta.title = document
      .querySelector('meta[property=og:title]')
      ?.getAttribute('content')
  }
  if (!meta.title) {
    meta.title = document.querySelector('title')?.textContent
  }

  // image
  if (!meta.image) {
    const images = [
      ...document.querySelectorAll(
        'meta[property=og:image], meta[name="twitter:image"], meta[itemprop="image"], meta[name="twitter:image:src"], meta[name="twitter:image0"]'
      ),
    ].map((i) => i.getAttribute('content'))

    meta.image = images[0]
  }

  // description
  if (!meta.description) {
    const descriptions = [
      ...document.querySelectorAll(
        'meta[name=description], meta[property="og:description"]'
      ),
    ].map((i) => i.getAttribute('content'))

    meta.description = descriptions[0]
  }

  // feeds
  if (!meta.feeds) {
    const feeds = [
      ...document.querySelectorAll('link[type*=rss], link[type*=atom]'),
    ].map((i) => {
      return {
        title: i.getAttribute('title'),
        url: new URL(i.getAttribute('href') || '', url.origin).toString(),
      }
    })

    meta.feeds = feeds
  }
  return meta
}
