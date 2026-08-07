import { Navigate, Outlet } from 'react-router-dom'
import { getRole, type AppRole } from '../services/auth/authService'

interface RoleRouteProps {
  allowedRole: AppRole
}

export default function RoleRoute({ allowedRole }: RoleRouteProps) {
  const storedRole = getRole()
  if (storedRole !== allowedRole) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export type { AppRole }
