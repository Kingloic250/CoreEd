import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as timetableApi from '@/api/timetableApi';
import { toast } from 'sonner';

export const TIMETABLE_KEY = 'timetable';

export function useGetTimetable(params?: { facultyId?: string; year?: string; semesterId?: string }) {
  return useQuery({
    queryKey: [TIMETABLE_KEY, params],
    queryFn: () => timetableApi.getTimetable(params),
  });
}

export function useGenerateTimetable() {
  return useMutation({
    mutationFn: timetableApi.generateTimetable,
  });
}

export function useApplyTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: timetableApi.applyTimetable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TIMETABLE_KEY] });
      toast.success('Timetable applied successfully');
    },
    onError: () => toast.error('Failed to apply timetable'),
  });
}

export function useCreateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: timetableApi.createTimetableEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TIMETABLE_KEY] });
      toast.success('Entry added');
    },
    onError: () => toast.error('Failed to add entry'),
  });
}

export function useUpdateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      timetableApi.updateTimetableEntry(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TIMETABLE_KEY] });
      toast.success('Entry updated');
    },
    onError: () => toast.error('Failed to update entry'),
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: timetableApi.deleteTimetableEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TIMETABLE_KEY] });
      toast.success('Entry removed');
    },
    onError: () => toast.error('Failed to remove entry'),
  });
}