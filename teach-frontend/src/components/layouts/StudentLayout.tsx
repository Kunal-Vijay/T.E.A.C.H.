import AppNavBar from '../nav/AppNavBar'
import ProductAmbient from '../shell/ProductAmbient'
import { LayoutGrid } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'

export default function StudentLayout() {
  const location = useLocation()
  const isClassroom = location.pathname.includes('/student/classroom/')

  return (
    <div className={`teach-shell${isClassroom ? ' teach-shell--classroom-route' : ' teach-shell--hub'}`}>
      <ProductAmbient intensity={isClassroom ? 'classroom' : 'hub'} />
      {!isClassroom ? (
        <AppNavBar
          homeTo="/student"
          homeAriaLabel="T.E.A.C.H home"
          links={[
            { kind: 'route', to: '/student', label: 'Classes', icon: LayoutGrid, end: true },
          ]}
        />
      ) : null}
      <div id="main-content" className="teach-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
