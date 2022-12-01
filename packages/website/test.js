/* eslint-disable no-console */
'use strict'
const { Web3Storage, getFilesFromPath } = require('web3.storage')
const path = require('path')
async function addToWeb3({
  endpoint,
  token,
  pathToAdd,
  name,
  wrapWithDirectory = false,
  includeHidden,
}) {
  const web3 = new Web3Storage({ endpoint, token })
  const files = await getFilesFromPath(pathToAdd, { hidden: includeHidden })
  const cid = await web3.put(files, { name, wrapWithDirectory })
  const url = `https://dweb.link/ipfs/${cid}`
  return { cid, url }
}

async function run() {
  console.log(
    await addToWeb3({
      endpoint: 'https://api.web3.storage',
      name: 'website',
      includeHidden: true,
      pathToAdd: path.join(__dirname, 'dist'),
      token: process.env.WEB3,
      wrapWithDirectory: false,
    })
  )
}

// eslint-disable-next-line unicorn/prefer-top-level-await
run()
