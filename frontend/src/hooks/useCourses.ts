import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as coursesApi from '@/api/coursesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetCourses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [QUERY_KEYS.COURSES, params],
    queryFn: () => coursesApi.getAllCourses(params),
  });
}

export function useGetCourse(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.COURSES, id],
    queryFn: () => coursesApi.getCourseById(id!),
    enabled: !!id,
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
  }  );
}

