import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Plus } from 'lucide-react'
import TeachLogo from '../branding/TeachLogo'
import Icon from '../ui/Icon'
import { clearAuth } from '../../services/auth/authService'

export default function TeacherLayout() {
  const navigate = useNavigate()

  const switchRole = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className="page dashboard teacher-dashboard">
      <header className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div className="dashboard-brand">
            <Link to="/teacher/classes" className="dashboard-logo-link" aria-label="Teacher dashboard home">
              <TeachLogo showTagline={false} />
            </Link>
            <span className="role-badge">Teacher</span>
          </div>
          <nav className="dashboard-nav" aria-label="Teacher">
            <NavLink
              to="/teacher/classes"
              end
              className={({ isActive }) => `dashboard-nav-link btn-with-icon${isActive ? ' is-active' : ''}`}
            >
              <Icon icon={LayoutGrid} size={16} className="nav-link-icon" />
              Classes
            </NavLink>
            <NavLink
              to="/teacher/classes/new"
              className={({ isActive }) => `dashboard-nav-link btn-with-icon${isActive ? ' is-active' : ''}`}
            >
              <Icon icon={Plus} size={16} className="nav-link-icon" />
              Create Class
            </NavLink>
            <button type="button" className="dashboard-nav-link dashboard-exit btn-with-icon" onClick={switchRole}>
              <Icon icon={LogOut} size={16} className="nav-link-icon" />
              Switch role
            </button>
          </nav>
        </div>
      </header>
      <div id="main-content">
        <Outlet />
      </div>
    </div>
  )
}
