import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';

import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { ContactAdminPage } from '@/pages/auth/ContactAdminPage';
import { ProfilePage } from '@/pages/admin/ProfilePage';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ManageStudents } from '@/pages/admin/ManageStudents';
import { ManageLecturers } from '@/pages/admin/ManageLecturers';
import { ManageCourses } from '@/pages/admin/ManageCourses';
import { ManageDepartments } from '@/pages/admin/ManageDepartments';
import { ManageSemesters } from '@/pages/admin/ManageSemesters';
import { ManageEnrollment } from '@/pages/admin/ManageEnrollment';
import { AccountRequests } from '@/pages/admin/AccountRequests';
import { SystemSettings } from '@/pages/admin/SystemSettings';
import { Reports } from '@/pages/admin/Reports';

import { LecturerDashboard } from '@/pages/lecturer/LecturerDashboard';
import { MyCourses } from '@/pages/lecturer/MyCourses';
import { AttendanceLog } from '@/pages/lecturer/AttendanceLog';
import { GradeInput } from '@/pages/lecturer/GradeInput';

import { NotificationsPage } from '@/pages/NotificationsPage';

import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { MyAttendance } from '@/pages/student/MyAttendance';
import { MyGrades } from '@/pages/student/MyGrades';
import { Transcript } from '@/pages/student/Transcript';
import { Announcements } from '@/pages/student/Announcements';
import { StudentCourseCatalog } from '@/pages/student/StudentCourseCatalog';

function RootRedirect() {
  const { isAuthenticated, getDashboardPath } = useAuth();
  if (isAuthenticated) return <Navigate to={getDashboardPath()} replace />;
  return <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getDashboardPath } = useAuth();
  if (isAuthenticated) return <Navigate to={getDashboardPath()} replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
        </Route>

        <Route path="/contact-admin" element={<ContactAdminPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="lecturers" element={<ManageLecturers />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="semesters" element={<ManageSemesters />} />
          <Route path="enrollment" element={<ManageEnrollment />} />
          <Route path="requests" element={<AccountRequests />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute role="lecturer">
              <DashboardLayout role="lecturer" />
            </ProtectedRoute>
          }
        >
          <Route index element={<LecturerDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="attendance" element={<AttendanceLog />} />
          <Route path="grades" element={<GradeInput />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="grades" element={<MyGrades />} />
          <Route path="courses" element={<StudentCourseCatalog />} />
          <Route path="transcript" element={<Transcript />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route
          path="/unauthorized"
          element={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">403 — Unauthorized</h1>
                <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
              </div>
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">404 — Page Not Found</h1>
                <p className="mt-2 text-muted-foreground">The page you are looking for does not exist.</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
