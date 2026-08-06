import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasSelectedMentor } from '../services/mentor/mentorService'

export default function MentorGate() {
  const location = useLocation()

  if (!hasSelectedMentor()) {
    return <Navigate to="/student/mentor" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
