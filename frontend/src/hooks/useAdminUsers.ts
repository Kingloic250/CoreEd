import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '@/api/usersApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetUsers() {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: usersApi.getAllUsers,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; email?: string; role?: string } }) =>
      usersApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success('User updated successfully');
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success('Password reset successfully');
    },
    onError: () => toast.error('Failed to reset password'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.USERS] });
      const previous = qc.getQueryData([QUERY_KEYS.USERS]);
      qc.setQueryData([QUERY_KEYS.USERS], (old: unknown[]) =>
        old?.filter((u) => (u as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.USERS], context?.previous);
      toast.error('Failed to delete user');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success('User deleted successfully');
    },
  });
}
