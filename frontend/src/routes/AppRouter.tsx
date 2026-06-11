import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { PageTransition } from '@/components/common/PageTransition';

import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ContactAdminPage } from '@/pages/auth/ContactAdminPage';
import { SetPasswordPage } from '@/pages/auth/SetPasswordPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
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
import { AuditLogs } from '@/pages/admin/AuditLogs';
import { ManageUsers } from '@/pages/admin/ManageUsers';
import { ManageTimetable } from '@/pages/admin/ManageTimetable';
import { ManageRooms } from '@/pages/admin/ManageRooms';
import { ManageCalendar } from '@/pages/admin/ManageCalendar';

import { LecturerDashboard } from '@/pages/lecturer/LecturerDashboard';
import { MyCourses } from '@/pages/lecturer/MyCourses';
import { CourseDetail } from '@/pages/lecturer/CourseDetail';
import { MyTimetable } from '@/pages/lecturer/MyTimetable';
import { AttendanceLog } from '@/pages/lecturer/AttendanceLog';
import { AttendanceHistory } from '@/pages/lecturer/AttendanceHistory';
import { GradeInput } from '@/pages/lecturer/GradeInput';
import { GradeBook } from '@/pages/lecturer/GradeBook';
import { LecturerProfile } from '@/pages/lecturer/LecturerProfile';
import { ManageAssignments } from '@/pages/lecturer/ManageAssignments';
import { AssignmentSubmissions } from '@/pages/lecturer/AssignmentSubmissions';
import { ManageClaims } from '@/pages/lecturer/ManageClaims';

import { NotificationsPage } from '@/pages/NotificationsPage';
import { AcademicCalendar } from '@/pages/AcademicCalendar';
import { Inbox } from '@/pages/Inbox';

import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { MyAttendance } from '@/pages/student/MyAttendance';
import { MyGrades } from '@/pages/student/MyGrades';
import { Transcript } from '@/pages/student/Transcript';
import { Announcements } from '@/pages/student/Announcements';
import { StudentCourseCatalog } from '@/pages/student/StudentCourseCatalog';
import { StudentCourseDetail } from '@/pages/student/StudentCourseDetail';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { StudentTimetable } from '@/pages/student/StudentTimetable';
import { MyStudies } from '@/pages/student/MyStudies';
import { AssignmentDetail } from '@/pages/student/AssignmentDetail';
import { FeeLedger } from '@/pages/student/FeeLedger';

function RootRedirect() {
  const { isAuthenticated, user, getDashboardPath } = useAuth();
  if (isAuthenticated) {
    if (!user?.verified) return <Navigate to="/verify-email" replace />;
    return <Navigate to={getDashboardPath()} replace />;
  }
  return <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, getDashboardPath } = useAuth();
  if (isAuthenticated) {
    if (!user?.verified) return <Navigate to="/verify-email" replace />;
    return <Navigate to={getDashboardPath()} replace />;
  }
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
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route path="/contact-admin" element={<PageTransition><ContactAdminPage /></PageTransition>} />
        <Route path="/set-password" element={<PageTransition><SetPasswordPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />

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
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="timetable" element={<ManageTimetable />} />
          <Route path="rooms" element={<ManageRooms />} />
          <Route path="calendar" element={<ManageCalendar />} />
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
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="assignments" element={<ManageAssignments />} />
          <Route path="assignments/:id" element={<AssignmentSubmissions />} />
          <Route path="claims" element={<ManageClaims />} />
          <Route path="calendar" element={<AcademicCalendar role="lecturer" />} />
          <Route path="messages" element={<Inbox role="lecturer" />} />
          <Route path="timetable" element={<MyTimetable />} />
          <Route path="attendance" element={<AttendanceLog />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="grades" element={<GradeInput />} />
          <Route path="grades/book" element={<GradeBook />} />
          <Route path="profile" element={<LecturerProfile />} />
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
          <Route path="courses/:id" element={<StudentCourseDetail />} />
          <Route path="studies" element={<MyStudies />} />
          <Route path="studies/assignments/:id" element={<AssignmentDetail />} />
          <Route path="fees" element={<FeeLedger />} />
          <Route path="messages" element={<Inbox role="student" />} />
          <Route path="calendar" element={<AcademicCalendar role="student" />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="transcript" element={<Transcript />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route
          path="/unauthorized"
          element={
            <PageTransition>
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground">403 — Unauthorized</h1>
                  <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
                </div>
              </div>
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground">404 — Page Not Found</h1>
                  <p className="mt-2 text-muted-foreground">The page you are looking for does not exist.</p>
                </div>
              </div>
            </PageTransition>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
