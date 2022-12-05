import { Router } from 'preact-router'

import ReloadPrompt from './prompt.jsx'
import About from './about.jsx'

export function App() {
  return (
    <>
      <main className="App">
        <h1 className="Home-title">HD App</h1>
        <Router>
          <About path="/about" />
        </Router>
        <ReloadPrompt />
      </main>
    </>
  )
}
