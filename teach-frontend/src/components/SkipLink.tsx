import { useLocation } from 'react-router-dom'

export default function SkipLink() {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return null
  }

  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  )
}
