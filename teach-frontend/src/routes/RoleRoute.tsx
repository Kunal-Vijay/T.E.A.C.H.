import { Navigate, Outlet } from 'react-router-dom'

interface RoleRouteProps {
  allowedRole: 'admin' | 'student'
}

export default function RoleRoute({ allowedRole }: RoleRouteProps) {
  const storedRole = sessionStorage.getItem('role')
  if (storedRole !== allowedRole) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
