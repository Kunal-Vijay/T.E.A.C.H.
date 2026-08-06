import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import HeroScene from '../components/welcome/HeroScene'
import Icon from '../components/ui/Icon'
import { trackEvent } from '../lib/analytics'
import { setRole, type AppRole } from '../services/auth/authService'

export default function WelcomePage() {
  const navigate = useNavigate()

  const continueAsRole = (role: AppRole) => {
    setRole(role)
    trackEvent('role_selected', { role })
    navigate(role === 'teacher' ? '/teacher/classes' : '/student')
  }

  return (
    <div className="welcome">
      <div className="welcome-ambient" aria-hidden="true">
        <div className="welcome-mesh welcome-mesh-a" />
        <div className="welcome-mesh welcome-mesh-b" />
        <div className="welcome-noise" />
      </div>

      <header className="welcome-nav">
        <p className="welcome-nav-brand">T.E.A.C.H</p>
        <p className="welcome-nav-tag">Autonomous Cognitive Heuristics</p>
      </header>

      <main className="welcome-hero" id="main-content">
        <div className="welcome-copy">
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
            Live AI mentors teach in real time. Students read ahead on a beautiful lesson board,
            take adaptive quizzes, and ask SAGE anything — no lecture loop, no waiting.
          </p>

          <ul className="welcome-pillars">
            <li>Live AI mentors</li>
            <li>Immersive classrooms</li>
            <li>Instant doubt resolution</li>
          </ul>

          <div className="welcome-actions">
            <button type="button" className="btn btn-primary btn-with-icon welcome-cta-primary" onClick={() => continueAsRole('teacher')}>
              I&apos;m a Teacher
              <Icon icon={ArrowRight} size={18} />
            </button>
            <button type="button" className="btn btn-secondary welcome-cta-secondary" onClick={() => continueAsRole('student')}>
              I&apos;m a Student
            </button>
          </div>
        </div>

        <HeroScene />
      </main>
    </div>
  )
}
