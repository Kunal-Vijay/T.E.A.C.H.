import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import WelcomePage from '../pages/WelcomePage'
import AdminClassListPage from '../pages/admin/AdminClassListPage'
import CreateClassPage from '../pages/admin/CreateClassPage'
import ClassDetailPage from '../pages/admin/ClassDetailPage'
import ReviewClassPage from '../pages/admin/ReviewClassPage'
import EditClassPage from '../pages/admin/EditClassPage'
import AdminClassPreviewPage from '../pages/admin/AdminClassPreviewPage'
import StudentClassCatalogPage from '../pages/student/StudentClassCatalogPage'
import ClassroomPage from '../pages/student/ClassroomPage'
import RoleRoute from './RoleRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route element={<RoleRoute allowedRole="admin" />}>
          <Route path="/admin/classes" element={<AdminClassListPage />} />
          <Route path="/admin/classes/new" element={<CreateClassPage />} />
          <Route path="/admin/classes/:planId/review" element={<ReviewClassPage />} />
          <Route path="/admin/classes/:planId/edit" element={<EditClassPage />} />
          <Route path="/admin/classes/:planId/preview" element={<AdminClassPreviewPage />} />
          <Route path="/admin/classes/:planId" element={<ClassDetailPage />} />
        </Route>
        <Route element={<RoleRoute allowedRole="student" />}>
          <Route path="/student" element={<StudentClassCatalogPage />} />
          <Route path="/student/classroom/:generationId" element={<ClassroomPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
