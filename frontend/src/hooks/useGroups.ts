import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupsApi from '@/api/groupsApi';
import { toast } from 'sonner';

export const GROUPS_KEY = 'groups';

export function useGetGroups(params?: { courseId?: string; semesterId?: string; lecturerId?: string }) {
  return useQuery({
    queryKey: [GROUPS_KEY, params],
    queryFn: () => groupsApi.getGroups(params),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success('Group created');
    },
    onError: () => toast.error('Failed to create group'),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      groupsApi.updateGroup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success('Group updated');
    },
    onError: () => toast.error('Failed to update group'),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success('Group deleted');
    },
    onError: () => toast.error('Failed to delete group'),
  });
}

export function useBulkCreateGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.bulkCreateGroups,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success(`${data.total} group(s) created`);
    },
    onError: () => toast.error('Failed to create groups'),
  });
}
