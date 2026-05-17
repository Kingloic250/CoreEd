import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as departmentsApi from '@/api/departmentsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetDepartments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DEPARTMENTS],
    queryFn: departmentsApi.getAllDepartments,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS] });
      toast.success('Department created successfully');
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      departmentsApi.updateDepartment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS] });
      toast.success('Department updated successfully');
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS] });
      const previous = qc.getQueryData([QUERY_KEYS.DEPARTMENTS]);
      qc.setQueryData([QUERY_KEYS.DEPARTMENTS], (old: unknown[]) =>
        old?.filter((d) => (d as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.DEPARTMENTS], context?.previous);
      toast.error('Failed to delete department');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEPARTMENTS] });
      toast.success('Department deleted successfully');
    },
  });
}
