import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as enrollApi from '@/api/enrollApi';
import { GROUPS_KEY } from '@/hooks/useGroups';
import { toast } from 'sonner';

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollApi.enrollStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success('Student enrolled');
    },
    onError: () => toast.error('Failed to enroll student'),
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      enrollApi.unenrollStudent(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
      toast.success('Student unenrolled');
    },
    onError: () => toast.error('Failed to unenroll student'),
  });
}

export function useMyEnrollments(studentId?: string) {
  return useQuery({
    queryKey: ['my-enrollments', studentId],
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
