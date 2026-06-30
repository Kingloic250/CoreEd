import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as programsApi from '@/api/programsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetPrograms(params?: { facultyId?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, params],
    queryFn: () => programsApi.getPrograms(params),
  });
}

export function useGetProgram(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, id],
    queryFn: () => programsApi.getProgram(id),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => programsApi.createProgram(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS] }); toast.success('Program created'); },
    onError: () => toast.error('Failed to create program'),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => programsApi.updateProgram(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS] }); toast.success('Program updated'); },
    onError: () => toast.error('Failed to update program'),
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programsApi.deleteProgram(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS] }); toast.success('Program deleted'); },
    onError: () => toast.error('Failed to delete program'),
  });
}

export function useGetCurricula(programId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, 'curricula', programId],
    queryFn: () => programsApi.getCurricula(programId),
    enabled: !!programId,
  });
}

export function useCreateCurriculum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, payload }: { programId: string; payload: Record<string, unknown> }) => programsApi.createCurriculum(programId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'curricula'] }); toast.success('Curriculum created'); },
    onError: () => toast.error('Failed to create curriculum'),
  });
}

export function useUpdateCurriculum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => programsApi.updateCurriculum(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'curricula'] }); toast.success('Curriculum updated'); },
    onError: () => toast.error('Failed to update curriculum'),
  });
}

export function useDeleteCurriculum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programsApi.deleteCurriculum(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'curricula'] }); toast.success('Curriculum deleted'); },
    onError: () => toast.error('Failed to delete curriculum'),
  });
}

export function useGetCurriculumCourses(curriculumId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, 'courses', curriculumId],
    queryFn: () => programsApi.getCurriculumCourses(curriculumId),
    enabled: !!curriculumId,
  });
}

export function useAddProgramCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => programsApi.addProgramCourse(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'courses'] }); toast.success('Course added'); },
    onError: () => toast.error('Failed to add course'),
  });
}

export function useUpdateProgramCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => programsApi.updateProgramCourse(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'courses'] }); toast.success('Course updated'); },
    onError: () => toast.error('Failed to update course'),
  });
}

export function useDeleteProgramCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programsApi.deleteProgramCourse(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'courses'] }); toast.success('Course removed'); },
    onError: () => toast.error('Failed to remove course'),
  });
}

export function useGetProgramEnrollments(programId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, 'enrollments', programId],
    queryFn: () => programsApi.getProgramEnrollments(programId),
    enabled: !!programId,
  });
}

export function useCreateProgramEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => programsApi.createProgramEnrollment(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'enrollments'] }); toast.success('Student enrolled'); },
    onError: (err: Error) => toast.error(err.message || 'Failed to enroll student'),
  });
}

export function useUpdateProgramEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => programsApi.updateProgramEnrollment(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROGRAMS, 'enrollments'] }); toast.success('Enrollment updated'); },
    onError: () => toast.error('Failed to update enrollment'),
  });
}

export function useGetStudentProgram(studentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROGRAMS, 'student', studentId],
    queryFn: () => programsApi.getStudentProgram(studentId),
    enabled: !!studentId,
  });
}
