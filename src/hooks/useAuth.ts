// Auth helper hook: login, logout, role checking
import { useAuthStore } from '@/store/authStore';
import { ROLES, type Role } from '@/utils/constants';

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useAuthStore();

  const hasRole = (role: Role): boolean => user?.role === role;

  const isAdmin = hasRole(ROLES.ADMIN);
  const isTeacher = hasRole(ROLES.TEACHER);
  const isStudent = hasRole(ROLES.STUDENT);

  const getDashboardPath = (): string => {
    if (isAdmin) return '/admin';
    if (isTeacher) return '/teacher';
    if (isStudent) return '/student';
    return '/login';
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    getDashboardPath,
  };
}
