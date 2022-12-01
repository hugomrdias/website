'use strict'

const baseURL = 'https://hugodias.me'
// const baseURL = 'http://localhost:8080'

function info() {
  return {
    name: 'Hugo Dias',
    title: 'Hugo Dias - Porto, Portugal, Protocol Labs',
    url: baseURL,
    domain: 'hugodias.me',
    lang: 'en',
    locale: 'en_us',
    image: baseURL + '/assets/images/avatar.jpg',
    description: 'Writing software for Web3.',
    author: {
      name: 'Hugo Dias',
      twitterHandle: 'hugomrdias',
    },
    publisher: {
      name: 'Hugo Dias',
    },
  }
}

module.exports = info
