'use strict'
const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const hasha = require('hasha')
const path = require('path')

// nunjuks only

/**
 * Add hash filter
 *
 * @param {string} absolutePath
 * @param {(arg0?: Error , arg1?: string ) => void} callback
 */
function addHash(absolutePath, callback) {
  readFile(path.join('./src', absolutePath), {
    encoding: 'utf8',
  })
    .then((content) => {
      return hasha.async(content)
    })
    .then((hash) => {
      callback(undefined, `${absolutePath}?hash=${hash.slice(0, 10)}`)
    })
    .catch((error) => {
      callback(new Error(`Failed to addHash to '${absolutePath}': ${error}`))
    })
}

/** @type {Record<string, any>} */
const out = {
  addHash,
}
module.exports = out
