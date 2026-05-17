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

  if (role && user?.role !== role) {
    const dashMap: Record<string, string> = {
      admin: '/admin',
      lecturer: '/lecturer',
      student: '/student',
    };
    const redirect = dashMap[user?.role ?? ''] ?? '/login';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
