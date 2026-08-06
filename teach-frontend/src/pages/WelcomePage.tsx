import { Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WelcomeNav from '../components/nav/WelcomeNav'
import HeroScene from '../components/welcome/HeroScene'
import RoleSelectionPicker, { COMMIT_DELAY_MS } from '../components/welcome/RoleSelectionPicker'
import Icon from '../components/ui/Icon'
import { cn } from '../lib/cn'
import { trackEvent } from '../lib/analytics'
import { setRole, type AppRole } from '../services/auth/authService'

export default function WelcomePage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  const chooseRole = useCallback((role: AppRole) => {
    if (pendingRole) {
      return
    }

    setSelectedRole(role)
    setPendingRole(role)
    setIsExiting(true)

    window.setTimeout(() => {
      setRole(role)
      trackEvent('role_selected', { role, source: 'welcome' })
      navigate(role === 'teacher' ? '/teacher/classes' : '/student')
    }, COMMIT_DELAY_MS)
  }, [navigate, pendingRole])

  return (
    <div className={cn('welcome', isExiting && 'welcome--exiting')}>
      <div className="welcome-ambient" aria-hidden="true">
        <div className="welcome-mesh welcome-mesh-a" />
        <div className="welcome-mesh welcome-mesh-b" />
        <div className="welcome-ambient-scene" />
        <div className="welcome-ambient-texture" />
        <div className="welcome-noise" />
        <div className="welcome-ambient-lighting" />
      </div>

      <WelcomeNav />

      <main className="welcome-hero container" id="main-content">
        <div className="welcome-hero-top">
          <div className="welcome-copy-main">
            <div className="welcome-eyebrow">
              <Icon icon={Sparkles} size={14} />
              AI-native education platform
            </div>

            <h1 className="welcome-headline">
              This is the future
              <span className="welcome-headline-break"> of </span>
              <span className="welcome-headline-accent">learning.</span>
            </h1>

            <p className="welcome-lead">
              Live AI Tutors teach in real time. Students read ahead on a beautiful lesson board,
              take adaptive quizzes, and ask SAGE anything — no lecture loop, no waiting.
            </p>

            <ul className="welcome-pillars">
              <li>Live AI Tutors</li>
              <li>Immersive classrooms</li>
              <li>Instant doubt resolution</li>
            </ul>
          </div>

          <HeroScene />
        </div>

        <div className="welcome-hero-bottom">
          <RoleSelectionPicker
            selectedRole={selectedRole}
            pendingRole={pendingRole}
            onChooseRole={chooseRole}
          />
        </div>
      </main>
    </div>
  )
}
