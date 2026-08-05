import { useNavigate } from 'react-router-dom'
import TeachLogo from '../components/branding/TeachLogo'

export default function WelcomePage() {
  const navigate = useNavigate()

  const continueAsRole = (role: 'admin' | 'student') => {
    sessionStorage.setItem('role', role)
    navigate(role === 'admin' ? '/admin/classes' : '/student')
  }

  return (
    <div className="page welcome-page">
      <div className="welcome-content">
        <TeachLogo size="large" />
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={() => continueAsRole('admin')}>
            Continue as Admin
          </button>
          <button className="btn btn-secondary" onClick={() => continueAsRole('student')}>
            Continue as Student
          </button>
        </div>
      </div>
      <style>{`
        .welcome-page { display: grid; place-items: center; padding: 2rem; background: radial-gradient(circle at top, #dbeafe, transparent 45%), var(--teach-bg); }
        .welcome-content { display: flex; flex-direction: column; align-items: center; gap: 2.5rem; }
        .welcome-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
      `}</style>
    </div>
  )
}
