import { Router } from 'preact-router'
import { Link } from 'preact-router/match'
import Share from './about.jsx'
import Callback from './callback.jsx'
import Home from './home.jsx'
import Login from './login.jsx'
import OTP from './otp.jsx'
import ReloadPrompt from './prompt.jsx'

export function App() {
  return (
    <>
      <main className="App">
        <Router>
          <Home path="/" />
          <Share path="/share" />
          <Login path="/login" />
          <OTP path="/otp" />
          <Callback path="/callback" />
        </Router>
        <ReloadPrompt />
      </main>
    </>
  )
}

/**
 *
 * @param {object} param0
 * @param {import('./types.js').User} [param0.user]
 * @param {string} param0.title
 */
export function TopBar({ user, title }) {
  return (
    <header class="TopBar">
      <div class="TopBar-row">
        <section class="TopBar-section">
          <img src={user?.gravatar} />
          <span class="TopBar-title">{title}</span>
        </section>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <section class="BottomBar">
      <div class="BottomBar-row">
        <section class="BottomBar-section">
          <Link class="BottomBar-icon" href="/" activeClassName="active">
            <svg class="icon icon-home">
              <use xlinkHref="#icon-home" />
            </svg>
          </Link>
        </section>
        <section class="BottomBar-section">
          <Link class="BottomBar-icon" href="/share" activeClassName="active">
            <svg class="icon icon-user">
              <use xlinkHref="#icon-user" />
            </svg>
          </Link>
        </section>
        <section class="BottomBar-section">
          <Link
            class="BottomBar-icon"
            href="/share?text=https://www.jasnell.me/"
            activeClassName="active"
          >
            <svg class="icon icon-user">
              <use xlinkHref="#icon-user" />
            </svg>
          </Link>
        </section>
      </div>
    </section>
  )
}
