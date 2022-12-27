import { Router } from 'preact-router'
import ReloadPrompt from './prompt.jsx'
import Share from './about.jsx'
import Login from './login.jsx'
import Callback from './callback.jsx'
import Home from './home.jsx'

export function App() {
  return (
    <>
      <main className="App">
        <Router>
          <Home path="/" />
          <Share path="/share" />
          <Login path="/login" />
          <Callback path="/callback" />
        </Router>
        <ReloadPrompt />
      </main>
    </>
  )
}
