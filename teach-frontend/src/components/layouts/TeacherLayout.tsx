import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Plus, Settings } from 'lucide-react'
import AppNavBar from '../nav/AppNavBar'
import ProductAmbient from '../shell/ProductAmbient'
import { clearAuth } from '../../services/auth/authService'

export default function TeacherLayout() {
  const navigate = useNavigate()

  const switchRole = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className="teach-shell teach-shell--hub">
      <ProductAmbient intensity="hub" />
      <AppNavBar
        homeTo="/teacher/classes"
        homeAriaLabel="Teacher dashboard home"
        roleLabel="Teacher"
        links={[
          { kind: 'route', to: '/teacher/classes', label: 'Classes', icon: LayoutGrid, end: true },
          { kind: 'route', to: '/teacher/classes/new', label: 'Create Class', icon: Plus },
          { kind: 'route', to: '/teacher/settings', label: 'Settings', icon: Settings },
          { kind: 'action', label: 'Switch role', icon: LogOut, onClick: switchRole, tone: 'exit' },
        ]}
      />
      <div id="main-content" className="teach-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
