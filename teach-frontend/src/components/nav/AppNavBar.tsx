import { Link, NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import TeachLogo from '../branding/TeachLogo'
import Icon from '../ui/Icon'
import ThemeSwitcher from './ThemeSwitcher'

export interface AppNavRouteLink {
  kind: 'route'
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export interface AppNavActionLink {
  kind: 'action'
  label: string
  icon: LucideIcon
  onClick: () => void
  tone?: 'default' | 'exit'
}

export type AppNavLink = AppNavRouteLink | AppNavActionLink

interface AppNavBarProps {
  homeTo: string
  homeAriaLabel: string
  links: AppNavLink[]
}

export default function AppNavBar({
  homeTo,
  homeAriaLabel,
  links,
}: AppNavBarProps) {
  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <div className="app-nav-brand">
          <Link to={homeTo} className="app-nav-logo" aria-label={homeAriaLabel}>
            <TeachLogo showTagline={false} />
          </Link>
        </div>
        <nav className="app-nav-links" aria-label="Main navigation">
          <ThemeSwitcher />
          {links.map((link, index) => {
            const showDivider = link.kind === 'action' && link.tone === 'exit' && index > 0

            if (link.kind === 'route') {
              return (
                <NavLink
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `app-nav-link btn-with-icon${isActive ? ' is-active' : ''}`
                  }
                >
                  <Icon icon={link.icon} size={16} className="app-nav-icon" />
                  {link.label}
                </NavLink>
              )
            }

            return (
              <span key={link.label} className="app-nav-action-wrap">
                {showDivider ? <span className="app-nav-divider" aria-hidden="true" /> : null}
                <button
                  type="button"
                  className={`app-nav-link btn-with-icon${link.tone === 'exit' ? ' app-nav-link--exit' : ''}`}
                  onClick={link.onClick}
                >
                  <Icon icon={link.icon} size={16} className="app-nav-icon" />
                  {link.label}
                </button>
              </span>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
