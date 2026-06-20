// React Query hooks for announcements data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as announcementsApi from '@/api/announcementsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetAnnouncements(role?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ANNOUNCEMENTS, role],
    queryFn: () => announcementsApi.getAnnouncements({ role }),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: announcementsApi.createAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] });
      toast.success('Announcement created successfully');
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; body?: string; targetRoles?: string[]; priority?: string }) =>
      announcementsApi.updateAnnouncement(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] });
      toast.success('Announcement updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'Failed to update announcement');
    },
  });
}
