import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as coursesApi from '@/api/coursesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetCourses() {
  return useQuery({
    queryKey: [QUERY_KEYS.COURSES],
    queryFn: coursesApi.getAllCourses,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      toast.success('Course created successfully');
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      coursesApi.updateCourse(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      toast.success('Course updated successfully');
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.deleteCourse,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.COURSES] });
      const previous = qc.getQueryData([QUERY_KEYS.COURSES]);
      qc.setQueryData([QUERY_KEYS.COURSES], (old: unknown[]) =>
        old?.filter((c) => (c as Record<string, unknown>).id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData([QUERY_KEYS.COURSES], context?.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      toast.success('Course deleted successfully');
    },
  });
}

export function useEnrollStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) =>
      coursesApi.enrollStudents(id, studentIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENTS] });
      toast.success('Enrollment updated successfully');
    },
    onError: () => {
      toast.error('Failed to update enrollment');
    },
  });
}

export function useSelfEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      coursesApi.selfEnroll(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      toast.success('Successfully enrolled');
    },
    onError: () => {
      toast.error('Failed to enroll');
    },
  });
}

export function useSelfUnenroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      coursesApi.selfUnenroll(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.COURSES] });
      toast.success('Successfully unenrolled');
    },
    onError: () => {
      toast.error('Failed to unenroll');
    },
  });
}
