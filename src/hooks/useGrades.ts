import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as gradesApi from '@/api/gradesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetGrades(params: { courseId?: string; studentId?: string; semester?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.GRADES, params],
    queryFn: () => gradesApi.getGrades(params),
    enabled: !!(params.courseId || params.studentId),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GRADES] });
      toast.success('Grades saved successfully');
    },
  });
}
