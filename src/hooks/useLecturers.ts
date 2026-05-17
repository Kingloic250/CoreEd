import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as lecturersApi from '@/api/lecturersApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetLecturers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [QUERY_KEYS.LECTURERS, params],
    queryFn: () => lecturersApi.getAllLecturers(params),
  });
}

export function useCreateLecturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lecturersApi.createLecturer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LECTURERS] });
      toast.success('Lecturer added successfully');
    },
  });
}

export function useUpdateLecturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      lecturersApi.updateLecturer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LECTURERS] });
      toast.success('Lecturer updated successfully');
    },
  });
}

export function useDeleteLecturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lecturersApi.deleteLecturer,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.LECTURERS] });
      const previous = qc.getQueryData([QUERY_KEYS.LECTURERS]);
      qc.setQueryData([QUERY_KEYS.LECTURERS], (old: unknown[]) =>
        old?.filter((t) => (t as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.LECTURERS], context?.previous);
      toast.error('Failed to delete lecturer');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LECTURERS] });
      toast.success('Lecturer deleted successfully');
    },
  });
}
