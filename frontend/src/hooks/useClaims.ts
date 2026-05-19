import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as claimsApi from '@/api/claimsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetClaims(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLAIMS, studentId],
    queryFn: () => claimsApi.getClaims({ studentId }),
    enabled: !!studentId,
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: claimsApi.createClaim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CLAIMS] });
      toast.success('Claim submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit claim');
    },
  });
}
