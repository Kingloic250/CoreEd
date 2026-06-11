import axiosInstance from './axiosInstance';

const BASE = '/api/v1/reports';

export const getOverview = () =>
  axiosInstance.get(`${BASE}/overview`) as unknown as Promise<{
    totalStudents: number;
    totalCourses: number;
    totalLecturers: number;
    totalDepartments: number;
  }>;

export const getAttendanceSummary = () =>
  axiosInstance.get(`${BASE}/attendance-summary`) as unknown as Promise<
    { courseId: string; name: string; rate: number; present: number; total: number }[]
  >;

export const getGradeDistribution = () =>
  axiosInstance.get(`${BASE}/grade-distribution`) as unknown as Promise<
    { range: string; count: number }[]
  >;