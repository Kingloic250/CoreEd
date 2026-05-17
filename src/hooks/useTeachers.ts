// React Query hooks for teacher data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as teachersApi from '@/api/teachersApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetTeachers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [QUERY_KEYS.TEACHERS, params],
    queryFn: () => teachersApi.getAllTeachers(params),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teachersApi.createTeacher,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.TEACHERS] });
      toast.success('Teacher added successfully');
    },
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      teachersApi.updateTeacher(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.TEACHERS] });
      toast.success('Teacher updated successfully');
    },
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teachersApi.deleteTeacher,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.TEACHERS] });
      const previous = qc.getQueryData([QUERY_KEYS.TEACHERS]);
      qc.setQueryData([QUERY_KEYS.TEACHERS], (old: unknown[]) =>
        old?.filter((t) => (t as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.TEACHERS], context?.previous);
      toast.error('Failed to delete teacher');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.TEACHERS] });
      toast.success('Teacher deleted successfully');
    },
  });
}
