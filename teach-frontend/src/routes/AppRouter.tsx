import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteFallback from '../components/RouteFallback'
import SkipLink from '../components/SkipLink'
import { usePageAnalytics } from '../hooks/usePageAnalytics'
import RoleRoute from './RoleRoute'

const WelcomePage = lazy(() => import('../pages/WelcomePage'))
const AdminClassListPage = lazy(() => import('../pages/admin/AdminClassListPage'))
const CreateClassPage = lazy(() => import('../pages/admin/CreateClassPage'))
const ClassDetailPage = lazy(() => import('../pages/admin/ClassDetailPage'))
const StudentClassCatalogPage = lazy(() => import('../pages/student/StudentClassCatalogPage'))
const ClassroomPage = lazy(() => import('../pages/student/ClassroomPage'))
const UnderstandingCheckPage = lazy(() => import('../pages/student/UnderstandingCheckPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const TeacherLayout = lazy(() => import('../components/layouts/TeacherLayout'))
const StudentLayout = lazy(() => import('../components/layouts/StudentLayout'))

function LegacyAdminPlanRedirect() {
  const { planId = '' } = useParams()
  return <Navigate to={`/teacher/classes/${planId}`} replace />
}

function RouterContent() {
  usePageAnalytics()

  return (
    <>
      <SkipLink />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />

          <Route element={<RoleRoute allowedRole="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher/classes" element={<AdminClassListPage />} />
              <Route path="/teacher/classes/new" element={<CreateClassPage />} />
              <Route path="/teacher/classes/:planId" element={<ClassDetailPage />} />
              <Route path="/teacher/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="student" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentClassCatalogPage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/classroom/:generationId" element={<ClassroomPage />} />
              <Route
                path="/student/understanding-check/:generationId"
                element={<UnderstandingCheckPage />}
              />
            </Route>
          </Route>

          <Route path="/student/mentor" element={<Navigate to="/student" replace />} />

          <Route path="/admin" element={<Navigate to="/teacher/classes" replace />} />
          <Route path="/admin/classes" element={<Navigate to="/teacher/classes" replace />} />
          <Route path="/admin/classes/new" element={<Navigate to="/teacher/classes/new" replace />} />
          <Route path="/admin/classes/:planId" element={<LegacyAdminPlanRedirect />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <RouterContent />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
