import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as assignmentsApi from '@/api/assignmentsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetAssignments(params?: { courseId?: string; studentId?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.ASSIGNMENTS, params],
    queryFn: () => assignmentsApi.getAssignments(params),
  });
}

export function useGetAssignmentById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ASSIGNMENTS, id],
    queryFn: () => assignmentsApi.getAssignmentById(id),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignmentsApi.createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ASSIGNMENTS] });
      toast.success('Assignment created');
    },
    onError: () => toast.error('Failed to create assignment'),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      assignmentsApi.updateAssignment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ASSIGNMENTS] });
      toast.success('Assignment updated');
    },
    onError: () => toast.error('Failed to update assignment'),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignmentsApi.deleteAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ASSIGNMENTS] });
      toast.success('Assignment deleted');
    },
    onError: () => toast.error('Failed to delete assignment'),
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      assignmentsApi.submitAssignment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ASSIGNMENTS] });
      toast.success('Assignment submitted successfully');
    },
    onError: () => toast.error('Failed to submit assignment'),
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, studentId, data }: {
      assignmentId: string;
      studentId: string;
      data: { score: number; feedback: string };
    }) => assignmentsApi.gradeSubmission(assignmentId, studentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ASSIGNMENTS] });
      toast.success('Submission graded');
    },
    onError: () => toast.error('Failed to grade submission'),
  });
}
