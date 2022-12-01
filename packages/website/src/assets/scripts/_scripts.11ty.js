'use strict'

const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')

// the file name as an entry point for postcss compilation
// also used to define the output filename in our output /css folder.
const fileName = 'main.js'

// eslint-disable-next-line unicorn/require-array-join-separator
const isDev = /serve/.test(process.argv.join())

module.exports = class {
  async data() {
    const rawFilepath = path.join(__dirname, `${fileName}`)
    return {
      permalink: `assets/scripts/${fileName}`,
      rawFilepath,
      eleventyExcludeFromCollections: true,
    }
  }

  // @ts-ignore
  async render({ rawFilepath }) {
    const outdir = path.join(__dirname, '../../../dist/assets/scripts')
    const out = await esbuild.build({
      entryPoints: [rawFilepath],
      bundle: true,
      write: false,
      minify: !isDev,
      sourcemap: 'linked',
      outdir,
    })

    fs.mkdirSync(outdir, { recursive: true })
    fs.writeFileSync(out.outputFiles[0].path, out.outputFiles[0].contents, {
      encoding: 'utf8',
    })
    return out.outputFiles[1].text
  }
}
