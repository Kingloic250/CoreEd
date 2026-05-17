// React Query hooks for student data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as studentsApi from '@/api/studentsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetStudents(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDENTS, params],
    queryFn: () => studentsApi.getAllStudents(params),
  });
}

export function useGetStudentById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDENTS, id],
    queryFn: () => studentsApi.getStudentById(id),
    enabled: !!id,
  });
}

export function useGetCurrentStudent() {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDENTS, 'current'],
    queryFn: studentsApi.getCurrentStudent,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENTS] });
      toast.success('Student added successfully');
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      studentsApi.updateStudent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENTS] });
      toast.success('Student updated successfully');
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.deleteStudent,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.STUDENTS] });
      const previous = qc.getQueryData([QUERY_KEYS.STUDENTS]);
      qc.setQueryData([QUERY_KEYS.STUDENTS], (old: unknown[]) =>
        old?.filter((s) => (s as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.STUDENTS], context?.previous);
      toast.error('Failed to delete student');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENTS] });
      toast.success('Student deleted successfully');
    },
  });
}
