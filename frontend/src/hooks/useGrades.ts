import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as gradesApi from '@/api/gradesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetGrades(params?: { courseId?: string; groupId?: string; semester?: string; status?: string; studentId?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.GRADES, params],
    queryFn: () => gradesApi.getGrades(params),
    enabled: !!(params?.courseId || params?.studentId || params?.status),
  });
}

export function useGetAdminGrades(params?: { courseId?: string; lecturerId?: string; groupId?: string; status?: string; semester?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.GRADES, 'admin', params],
    queryFn: () => gradesApi.getAdminGrades(params),
    enabled: true,
  });
}

export function useGetTranscript(studentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.GRADES, 'transcript', studentId],
    queryFn: () => gradesApi.getTranscript(studentId),
    enabled: !!studentId,
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gradesApi.createGrade,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
    },
  });
}

export function useSubmitGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gradesApi.submitGrades,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
      toast.success(`${data.count} grade(s) submitted for review`);
    },
    onError: () => toast.error('Failed to submit grades'),
  });
}

export function useApproveGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gradesApi.approveGrade,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
      toast.success('Grade approved');
    },
    onError: () => toast.error('Failed to approve grade'),
  });
}

export function useRejectGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionNote }: { id: string; rejectionNote?: string }) =>
      gradesApi.rejectGrade(id, { rejectionNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
      toast.success('Grade rejected');
    },
    onError: () => toast.error('Failed to reject grade'),
  });
}

export function useApproveAllGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gradesApi.approveAllGrades,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
      toast.success(`${data.count} grade(s) approved`);
    },
    onError: () => toast.error('Failed to approve grades'),
  });
}
