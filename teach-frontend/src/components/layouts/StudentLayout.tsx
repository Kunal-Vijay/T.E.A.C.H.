import AppNavBar from '../nav/AppNavBar'
import ProductAmbient from '../shell/ProductAmbient'
import StudyMentorAvatar from '../mentor/StudyMentorAvatar'
import { useMentor } from '../../context/MentorContext'
import { clearAuth } from '../../services/auth/authService'
import { LayoutGrid, LogOut, Settings } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tutor, tutorLabel } = useMentor()
  const isClassroom = location.pathname.includes('/student/classroom/')

  const switchRole = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className={`teach-shell${isClassroom ? ' teach-shell--classroom-route' : ' teach-shell--hub'}`}>
      <ProductAmbient intensity={isClassroom ? 'classroom' : 'hub'} />
      {!isClassroom ? (
        <AppNavBar
          homeTo="/student"
          homeAriaLabel="Student dashboard home"
          roleLabel="Student"
          mentorSlot={(
            <div className="app-nav-tutor" aria-label={tutorLabel}>
              <span aria-hidden="true">
                <StudyMentorAvatar tutor={tutor} size="sm" showGlow={false} ariaLabel="" />
              </span>
              <span>{tutor.name}</span>
            </div>
          )}
          links={[
            { kind: 'route', to: '/student', label: 'Classes', icon: LayoutGrid, end: true },
            { kind: 'route', to: '/student/settings', label: 'Settings', icon: Settings },
            { kind: 'action', label: 'Switch role', icon: LogOut, onClick: switchRole, tone: 'exit' },
          ]}
        />
      ) : null}
      <div id="main-content" className="teach-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
