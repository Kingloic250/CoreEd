import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as facultiesApi from '@/api/facultiesApi';
import { toast } from 'sonner';

export const FACULTIES_KEY = 'faculties';

export function useGetFaculties(params?: { departmentId?: string }) {
  return useQuery({
    queryKey: [FACULTIES_KEY, params],
    queryFn: () => facultiesApi.getAllFaculties(params),
  });
}

export function useCreateFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: facultiesApi.createFaculty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACULTIES_KEY] });
      toast.success('Faculty created successfully');
    },
  });
}

export function useUpdateFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      facultiesApi.updateFaculty(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACULTIES_KEY] });
      toast.success('Faculty updated successfully');
    },
  });
}

export function useDeleteFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: facultiesApi.deleteFaculty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FACULTIES_KEY] });
      toast.success('Faculty deleted successfully');
    },
  });
}
