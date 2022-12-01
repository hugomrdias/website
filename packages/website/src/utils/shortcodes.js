'use strict'
const Image = require('@11ty/eleventy-img')

/**
 * @param {Image.ImageSource} src
 * @param {string} alt
 * @param {any} sizes
 */
async function image(src, alt, sizes = '50vw') {
  const metadata = await Image(src, {
    urlPath: '_static/images',
    outputDir: './dist/_static/images/',
    widths: [256, 384],
    formats: ['avif', 'webp', 'jpeg'],
  })

  const imageAttributes = {
    alt,
    sizes,
    loading: 'lazy',
    decoding: 'async',
  }

  // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
  return Image.generateHTML(metadata, imageAttributes)
}

const out = { image }
module.exports = out
