import { Link } from 'react-router-dom'
import TeachLogo from '../branding/TeachLogo'
import ThemeSwitcher from './ThemeSwitcher'

export default function WelcomeNav() {
  return (
    <header className="app-nav app-nav--landing">
      <div className="app-nav-inner app-nav-inner--landing">
        <div className="app-nav-landing-brand">
          <Link to="/" className="app-nav-logo" aria-label="T.E.A.C.H home">
            <TeachLogo showTagline={false} />
          </Link>
          <p className="app-nav-tagline">
            Teaching Enhancement through Autonomous Cognitive Help
          </p>
        </div>

        <div className="app-nav-landing-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
