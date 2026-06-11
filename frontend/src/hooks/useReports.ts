import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '@/api/reportsApi';

export const QUERY_KEYS = {
  REPORTS_OVERVIEW: 'reports-overview',
  ATTENDANCE_SUMMARY: 'attendance-summary',
  GRADE_DISTRIBUTION: 'grade-distribution',
};

export function useReportsOverview() {
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS_OVERVIEW],
    queryFn: reportsApi.getOverview,
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY],
    queryFn: reportsApi.getAttendanceSummary,
  });
}

export function useGradeDistribution() {
  return useQuery({
    queryKey: [QUERY_KEYS.GRADE_DISTRIBUTION],
    queryFn: reportsApi.getGradeDistribution,
  });
}