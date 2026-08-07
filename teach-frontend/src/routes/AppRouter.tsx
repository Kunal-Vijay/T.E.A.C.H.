import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import RouteFallback from '../components/RouteFallback'
import SkipLink from '../components/SkipLink'
import { usePageAnalytics } from '../hooks/usePageAnalytics'
import RoleRoute from './RoleRoute'

const WelcomePage = lazy(() => import('../pages/WelcomePage'))
const AdminTopicListPage = lazy(() => import('../pages/admin/AdminTopicListPage'))
const CreateTopicPage = lazy(() => import('../pages/admin/CreateTopicPage'))
const TopicDetailPage = lazy(() => import('../pages/admin/TopicDetailPage'))
const StudentTopicCatalogPage = lazy(() => import('../pages/student/StudentTopicCatalogPage'))
const TopicModeSelectPage = lazy(() => import('../pages/student/TopicModeSelectPage'))
const LiveLearningSessionPage = lazy(() => import('../pages/student/LiveLearningSessionPage'))
const VivaSessionPage = lazy(() => import('../pages/student/VivaSessionPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const TeacherLayout = lazy(() => import('../components/layouts/TeacherLayout'))
const StudentLayout = lazy(() => import('../components/layouts/StudentLayout'))

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
              <Route path="/teacher/topics" element={<AdminTopicListPage />} />
              <Route path="/teacher/topics/new" element={<CreateTopicPage />} />
              <Route path="/teacher/topics/:topicId" element={<TopicDetailPage />} />
              <Route path="/teacher/settings" element={<SettingsPage />} />
              <Route path="/teacher/classes" element={<Navigate to="/teacher/topics" replace />} />
              <Route path="/teacher/classes/*" element={<Navigate to="/teacher/topics" replace />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="student" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentTopicCatalogPage />} />
              <Route path="/student/topics/:topicId" element={<TopicModeSelectPage />} />
              <Route path="/student/sessions/:sessionId" element={<LiveLearningSessionPage />} />
              <Route path="/student/sessions/:sessionId/viva" element={<VivaSessionPage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/classroom/:generationId" element={<Navigate to="/student" replace />} />
            </Route>
          </Route>

          <Route path="/student/mentor" element={<Navigate to="/student" replace />} />
          <Route path="/admin" element={<Navigate to="/teacher/topics" replace />} />
          <Route path="/admin/*" element={<Navigate to="/teacher/topics" replace />} />
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
