import { useAuthStore } from '@/store/authStore';
import { ROLES, type Role } from '@/utils/constants';

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, setUser, clearError } = useAuthStore();

  const hasRole = (role: Role): boolean => user?.role === role;

  const isAdmin = hasRole(ROLES.ADMIN);
  const isLecturer = hasRole(ROLES.LECTURER);
  const isStudent = hasRole(ROLES.STUDENT);

  const getDashboardPath = (): string => {
    if (isAdmin) return '/admin';
    if (isLecturer) return '/lecturer';
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
    setUser,
    clearError,
    hasRole,
    isAdmin,
    isLecturer,
    isStudent,
    getDashboardPath,
  };
}
