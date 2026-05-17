// React Query hooks for attendance data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as attendanceApi from '@/api/attendanceApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetAttendance(params: { classId?: string; date?: string; studentId?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, params],
    queryFn: () => attendanceApi.getAttendance(params),
    enabled: !!(params.classId || params.date || params.studentId),
  });
}

export function useGetStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, 'student', studentId],
    queryFn: () => attendanceApi.getStudentAttendance(studentId),
    enabled: !!studentId,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.markAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
    },
  });
}

export function useLogAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.logAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
      toast.success('Attendance submitted successfully');
    },
  });
}
