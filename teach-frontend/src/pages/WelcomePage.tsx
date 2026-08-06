import { useNavigate } from 'react-router-dom'
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
      <div className="welcome-bg" aria-hidden="true">
        <div className="welcome-glow welcome-glow-a" />
        <div className="welcome-glow welcome-glow-b" />
        <div className="welcome-grid" />
        <svg className="welcome-art" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="88" y="120" width="420" height="280" rx="28" fill="#0F172A" />
          <rect x="112" y="148" width="372" height="200" rx="16" fill="#14B8A6" />
          <circle cx="298" cy="248" r="42" fill="#FAFAF9" />
          <path d="M276 248h44M298 226v44" stroke="#0F172A" strokeWidth="10" strokeLinecap="round" />
          <rect x="148" y="372" width="90" height="14" rx="7" fill="#14B8A6" opacity="0.85" />
          <rect x="252" y="372" width="140" height="14" rx="7" fill="#0F172A" opacity="0.14" />
          <rect x="360" y="420" width="260" height="200" rx="32" fill="#CCFBF1" />
          <circle cx="490" cy="500" r="48" fill="#0F172A" />
          <circle cx="474" cy="488" r="6" fill="#FAFAF9" />
          <circle cx="506" cy="488" r="6" fill="#FAFAF9" />
          <path d="M468 518c10 14 34 14 44 0" stroke="#14B8A6" strokeWidth="6" strokeLinecap="round" />
          <path className="welcome-wave" d="M120 560c40-40 80 40 120 0s80 40 120 0 80 40 120 0" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      <main className="welcome-stage" id="main-content">
        <div className="welcome-brand-block">
          <p className="welcome-brand">T.E.A.C.H</p>
          <ul className="welcome-full-form" aria-label="Teacherless Education through Autonomous Cognitive Heuristics">
            <li>Teacherless</li>
            <li>Education</li>
            <li>through</li>
            <li>Autonomous</li>
            <li>Cognitive</li>
            <li>Heuristics</li>
          </ul>
        </div>
        <h1 className="welcome-headline">
          School, but make it
          <span className="welcome-headline-accent"> autonomous.</span>
        </h1>
        <p className="welcome-support">
          Live AI class energy. Slides, quizzes, and SAGE doubts — no boring lecture loop.
        </p>
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={() => continueAsRole('teacher')}>
            I&apos;m a Teacher
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => continueAsRole('student')}>
            I&apos;m a Student
          </button>
        </div>
      </main>
    </div>
  )
}
