import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountRequestApi } from '@/api/accountRequestApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useAccountRequests() {
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_REQUESTS],
    queryFn: accountRequestApi.getAll,
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountRequestApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_REQUESTS] });
      toast.success('Request approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountRequestApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_REQUESTS] });
      toast.success('Request rejected');
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });
}
