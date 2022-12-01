'use strict'

const { DateTime } = require('luxon')

/**
 * @param {Date} date
 * @param {any} format
 */
function dateToFormat(date, format) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(String(format))
}

/**
 * @param {Date} date
 */
function dateToISO(date) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISO({
    includeOffset: false,
    suppressMilliseconds: true,
  })
}

/**
 * @param {string} str
 */
function obfuscate(str) {
  const chars = []
  for (let i = str.length - 1; i >= 0; i--) {
    // @ts-ignore
    chars.unshift(['&#', str[i].codePointAt(), ';'].join(''))
  }
  return chars.join('')
}

/** @type {Record<string,any>} */
const out = {
  dateToFormat,
  dateToISO,
  obfuscate,
}
module.exports = out
