// Route guard: checks authentication and role, redirects as needed
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a role is required and the user's role doesn't match, redirect to their dashboard
  if (role && user?.role !== role) {
    const dashMap: Record<string, string> = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
    };
    const redirect = dashMap[user?.role ?? ''] ?? '/login';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
