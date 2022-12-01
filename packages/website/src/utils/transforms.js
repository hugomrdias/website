'use strict'
const fs = require('fs')
const path = require('path')
const { PurgeCSS } = require('purgecss')
const postcss = require('postcss')
const htmlmin = require('html-minifier')

// eslint-disable-next-line unicorn/require-array-join-separator
const isDev = /serve/.test(process.argv.join())

const shouldTransformHTML = (/** @type {string} */ outputPath) =>
  outputPath && outputPath.endsWith('.html') && !isDev

/**
 * @param {string} rawContent
 * @param {string} outputPath
 */
async function cssinline(rawContent, outputPath) {
  let content = rawContent
  if (outputPath && outputPath.endsWith('.html')) {
    // postcss
    const fileName = 'styles.css'
    const rawFilepath = path.join(__dirname, `../assets/styles/${fileName}`)

    // @ts-ignore
    const css = await postcss(
      [
        require('postcss-import'),
        require('postcss-preset-env')({ stage: 1 }),
        // @ts-ignore
        !isDev && require('postcss-csso'),
      ].filter(Boolean)
    ).process(fs.readFileSync(rawFilepath), {
      from: rawFilepath,
      map: isDev ? { inline: true } : false,
    })

    // purge
    const purged = await new PurgeCSS().purge({
      content: [
        {
          raw: rawContent,
          extension: 'html',
        },
      ],
      css: [
        {
          raw: css.css,
        },
      ],
      fontFace: true,
      variables: true,
    })
    content = content.replace(
      '</head>',
      `<style>${purged[0].css}</style></head>`
    )
  }
  return content
}

/**
 * @param {string} content
 * @param {string} outputPath
 */
function htmlminify(content, outputPath) {
  if (shouldTransformHTML(outputPath)) {
    return htmlmin.minify(content, {
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeComments: true,
      sortClassName: true,
      sortAttributes: true,
      html5: true,
      decodeEntities: true,
      removeOptionalTags: false,
    })
  }
  return content
}

/** @type {Record<string, any>} */
const out = {
  cssinline,
  htmlminify,
}

module.exports = out
