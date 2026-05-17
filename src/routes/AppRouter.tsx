// Root router configuration for all application routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Auth
import { LoginPage } from '@/pages/auth/LoginPage';
import { ContactAdminPage } from '@/pages/auth/ContactAdminPage';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ManageStudents } from '@/pages/admin/ManageStudents';
import { ManageTeachers } from '@/pages/admin/ManageTeachers';
import { ManageClasses } from '@/pages/admin/ManageClasses';
import { AccountRequests } from '@/pages/admin/AccountRequests';
import { SystemSettings } from '@/pages/admin/SystemSettings';
import { Reports } from '@/pages/admin/Reports';

// Teacher pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { MyClasses } from '@/pages/teacher/MyClasses';
import { AttendanceLog } from '@/pages/teacher/AttendanceLog';
import { GradeInput } from '@/pages/teacher/GradeInput';

// Shared pages
import { NotificationsPage } from '@/pages/NotificationsPage';

// Student pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { MyAttendance } from '@/pages/student/MyAttendance';
import { MyGrades } from '@/pages/student/MyGrades';
import { Transcript } from '@/pages/student/Transcript';
import { Announcements } from '@/pages/student/Announcements';

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

        {/* Auth routes */}
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

        {/* Admin routes */}
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
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="requests" element={<AccountRequests />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Teacher routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <DashboardLayout role="teacher" />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="attendance" element={<AttendanceLog />} />
          <Route path="grades" element={<GradeInput />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Student routes */}
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
          <Route path="transcript" element={<Transcript />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Misc */}
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
