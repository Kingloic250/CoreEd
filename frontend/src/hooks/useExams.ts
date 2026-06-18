import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as examsApi from '@/api/examsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetExams(params?: { courseId?: string; groupId?: string; lecturerId?: string; status?: string; type?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.EXAMS, params],
    queryFn: () => examsApi.getExams(params),
  });
}

export function useGetExam(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.EXAMS, id],
    queryFn: () => examsApi.getExam(id!),
    enabled: !!id,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: examsApi.createExam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Exam created'); },
    onError: () => toast.error('Failed to create exam'),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => examsApi.updateExam(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Exam updated'); },
    onError: () => toast.error('Failed to update exam'),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: examsApi.deleteExam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Exam deleted'); },
    onError: () => toast.error('Failed to delete exam'),
  });
}

export function useUpdateExamStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => examsApi.updateExamStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Exam status updated'); },
    onError: () => toast.error('Failed to update status'),
  });
}

export function useCreateExamResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, payload }: { examId: string; payload: { studentId: string; score: number; comments?: string } }) =>
      examsApi.createExamResult(examId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); },
  });
}

export function useSubmitExamResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: examsApi.submitExamResults,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] });
      toast.success(`${data.count} result(s) submitted for review`);
    },
    onError: () => toast.error('Failed to submit results'),
  });
}

export function useApproveExamResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: examsApi.approveExamResult,
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Result approved'); },
    onError: () => toast.error('Failed to approve result'),
  });
}

export function useRejectExamResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionNote }: { id: string; rejectionNote?: string }) =>
      examsApi.rejectExamResult(id, { rejectionNote }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMS] }); toast.success('Result rejected'); },
    onError: () => toast.error('Failed to reject result'),
  });
}
