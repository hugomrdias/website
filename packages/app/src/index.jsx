import { render } from 'preact'
import { App } from './app.jsx'
import './index.css'

// eslint-disable-next-line unicorn/prefer-query-selector
const appEl = document.getElementById('app')

if (appEl) {
  render(<App />, appEl)
}
