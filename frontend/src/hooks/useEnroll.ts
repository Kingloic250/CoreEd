import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as enrollApi from '@/api/enrollApi';
import { GROUPS_KEY } from '@/hooks/useGroups';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export const ENROLL_KEY = 'enrollments';
export const CREDITS_KEY = 'credit-usage';
export const WAITLIST_KEY = 'waitlist';

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollApi.enrollStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      qc.invalidateQueries({ queryKey: [ENROLL_KEY] });
      qc.invalidateQueries({ queryKey: [CREDITS_KEY] });
      toast.success('Student enrolled');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to enroll student');
    },
  });
}

export function useDropCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      enrollApi.dropCourse(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      qc.invalidateQueries({ queryKey: [ENROLL_KEY] });
      qc.invalidateQueries({ queryKey: [CREDITS_KEY] });
      toast.success('Course dropped/withdrawn');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to drop course');
    },
  });
}

export function useJoinWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollApi.joinWaitlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      qc.invalidateQueries({ queryKey: [WAITLIST_KEY] });
      toast.success('Added to waitlist');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to join waitlist');
    },
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      enrollApi.unenrollStudent(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      qc.invalidateQueries({ queryKey: [ENROLL_KEY] });
      toast.success('Student unenrolled');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to unenroll student');
    },
  });
}

export function useMyEnrollments(studentId?: string) {
  return useQuery({
    queryKey: [ENROLL_KEY, studentId],
    queryFn: () => enrollApi.getMyEnrollments(studentId),
    enabled: !!studentId,
  });
}

export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: [GROUPS_KEY, 'course-enrollments', courseId],
    queryFn: () => enrollApi.getCourseEnrollments(courseId),
    enabled: !!courseId,
  });
}

export function useCreditUsage(studentId?: string) {
  return useQuery({
    queryKey: [CREDITS_KEY, studentId],
    queryFn: () => enrollApi.getCreditUsage(studentId),
    enabled: !!studentId,
  });
}

export function useMyWaitlist(studentId?: string) {
  return useQuery({
    queryKey: [WAITLIST_KEY, studentId],
    queryFn: () => enrollApi.getMyWaitlist(studentId!),
    enabled: !!studentId,
  });
}
