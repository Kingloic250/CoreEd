// React Query hooks for classes data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as classesApi from '@/api/classesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetClasses() {
  return useQuery({
    queryKey: [QUERY_KEYS.CLASSES],
    queryFn: classesApi.getAllClasses,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: classesApi.createClass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CLASSES] });
      toast.success('Class created successfully');
    },
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      classesApi.updateClass(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CLASSES] });
      toast.success('Class updated successfully');
    },
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: classesApi.deleteClass,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.CLASSES] });
      const previous = qc.getQueryData([QUERY_KEYS.CLASSES]);
      qc.setQueryData([QUERY_KEYS.CLASSES], (old: unknown[]) =>
        old?.filter((c) => (c as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.CLASSES], context?.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CLASSES] });
      toast.success('Class deleted successfully');
    },
  });
}
