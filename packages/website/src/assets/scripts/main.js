'use strict'

const $body = document.body

addEventListener('load', function () {
  setTimeout(function () {
    $body.className = $body.className.replace(/\bis-loading\b/, 'is-playing')
    setTimeout(function () {
      $body.className = $body.className.replace(/\bis-playing\b/, 'is-ready')
    }, 1250)
  }, 100)
})
