import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as semestersApi from '@/api/semestersApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetSemesters() {
  return useQuery({
    queryKey: [QUERY_KEYS.SEMESTERS],
    queryFn: semestersApi.getAllSemesters,
  });
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: semestersApi.createSemester,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SEMESTERS] });
      toast.success('Semester created successfully');
    },
  });
}

export function useUpdateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      semestersApi.updateSemester(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SEMESTERS] });
      toast.success('Semester updated successfully');
    },
  });
}

export function useDeleteSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: semestersApi.deleteSemester,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.SEMESTERS] });
      const previous = qc.getQueryData([QUERY_KEYS.SEMESTERS]);
      qc.setQueryData([QUERY_KEYS.SEMESTERS], (old: unknown[]) =>
        old?.filter((s) => (s as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.SEMESTERS], context?.previous);
      toast.error('Failed to delete semester');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SEMESTERS] });
      toast.success('Semester deleted successfully');
    },
  });
}

export function useGetActiveSemester() {
  const { data: semesters } = useGetSemesters();
  const active = (semesters as Record<string, unknown>[] | undefined)?.find(
    (s) => s.isActive === true
  );
  return { activeSemester: active ?? null };
}

export function useSetActiveSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: semestersApi.setActiveSemester,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SEMESTERS] });
      toast.success('Active semester updated');
    },
    onError: () => {
      toast.error('Failed to set active semester');
    },
  });
}
