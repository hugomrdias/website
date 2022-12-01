// @ts-ignore
const pluginSvgSprite = require('eleventy-plugin-svg-sprite')
// @ts-ignore
const sitemap = require('@quasibit/eleventy-plugin-sitemap')
// @ts-ignore
const schema = require('@quasibit/eleventy-plugin-schema')
// @ts-ignore
const faviconsPlugin = require('eleventy-plugin-gen-favicons')

const filters = require('./src/utils/filters.js')
const asyncFilters = require('./src/utils/async-filter.js')
const transforms = require('./src/utils/transforms.js')
const shortcodes = require('./src/utils/shortcodes.js')

/**
 * @param {any} config
 */
function config(config) {
  // Plugins
  config.addPlugin(schema)
  config.addPlugin(sitemap, {
    sitemap: {
      hostname: 'https://hugodias.me',
    },
  })
  config.addPlugin(faviconsPlugin, {
    outputDir: 'dist',
    generateManifest: false,
  })
  config.addPlugin(pluginSvgSprite, {
    path: './src/assets/icons',
    svgSpriteShortcode: 'iconsprite',
  })

  // Asset Watch Targets
  config.addWatchTarget('./src/assets')

  // Layouts
  config.addLayoutAlias('base', 'base.njk')
  config.addLayoutAlias('post', 'post.njk')

  // Pass-through files
  config.addPassthroughCopy('src/robots.txt')
  config.addPassthroughCopy('src/assets/images')
  config.addPassthroughCopy('src/site.webmanifest')
  config.addPassthroughCopy('src/_headers')
  config.addPassthroughCopy('src/assets/fonts')

  // Deep-Merge
  config.setDataDeepMerge(true)

  // Transforms
  Object.keys(transforms).forEach((transformName) => {
    config.addTransform(transformName, transforms[transformName])
  })

  // Filters
  Object.keys(filters).forEach((filterName) => {
    config.addFilter(filterName, filters[filterName])
  })
  Object.keys(asyncFilters).forEach((filterName) => {
    config.addNunjucksAsyncFilter(filterName, asyncFilters[filterName])
  })

  // Shortcodes
  config.addNunjucksAsyncShortcode('image', shortcodes.image)

  // Base Config
  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: 'includes',
      layouts: 'layouts',
      data: 'data',
    },
    templateFormats: ['njk', 'md', '11ty.js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  }
}

module.exports = config
