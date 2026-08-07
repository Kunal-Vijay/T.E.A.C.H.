import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteFallback from '../components/RouteFallback'
import SkipLink from '../components/SkipLink'
import { usePageAnalytics } from '../hooks/usePageAnalytics'
import RoleRoute from './RoleRoute'

const WelcomePage = lazy(() => import('../pages/WelcomePage'))
const StudentTopicCatalogPage = lazy(() => import('../pages/student/StudentTopicCatalogPage'))
const LiveLearningSessionPage = lazy(() => import('../pages/student/LiveLearningSessionPage'))
const VivaSessionPage = lazy(() => import('../pages/student/viva/VivaExperience'))
const StudentLayout = lazy(() => import('../components/layouts/StudentLayout'))

function RouterContent() {
  usePageAnalytics()

  return (
    <>
      <SkipLink />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />

          <Route element={<RoleRoute allowedRole="student" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentTopicCatalogPage />} />
              <Route path="/student/topics/:topicId" element={<StudentTopicCatalogPage />} />
              <Route path="/student/sessions/:sessionId" element={<LiveLearningSessionPage />} />
              <Route path="/student/sessions/:sessionId/viva" element={<VivaSessionPage />} />
              <Route path="/student/classroom/:generationId" element={<Navigate to="/student" replace />} />
            </Route>
          </Route>

          <Route path="/student/mentor" element={<Navigate to="/student" replace />} />
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
          <Route path="/teacher/*" element={<Navigate to="/" replace />} />
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
