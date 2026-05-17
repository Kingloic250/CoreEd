import { useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarDays, BookOpen, User, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAttendance } from '@/hooks/useAttendance';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';
import { attendanceStatusBadge as statusBadge } from '@/utils/formatters';
import { useState } from 'react';

export function AttendanceHistory() {
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;

  const { data: courses } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const { data: students } = useGetStudents({});
  const { data: attendance, isLoading } = useGetAttendance(
    lecturerId ? { markedBy: lecturerId } : { markedBy: undefined }
  );

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const studentList = (students as Record<string, unknown>[]) ?? [];
  const records = (attendance as Record<string, unknown>[]) ?? [];

  const getCourseName = (courseId: string) =>
    courseList.find((c) => String(c.id) === courseId)?.name as string ?? courseId;
  const getStudentName = (studentId: string) => {
    const s = studentList.find((s) => String(s.id) === studentId);
    return s ? `${String(s.firstName)} ${String(s.lastName)}` : studentId;
  };

  // Group records by date + course
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof records>();
    const filtered = records.filter((r) => {
      if (courseFilter && String(r.courseId) !== courseFilter) return false;
      if (statusFilter && String(r.status) !== statusFilter) return false;
      return true;
    });
    for (const r of filtered) {
      const key = `${r.date}|${r.courseId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return groups;
  }, [records, courseFilter, statusFilter]);

  // Sort groups by date descending
  const sortedGroups = useMemo(
    () => [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0])),
    [grouped]
  );

  return (
    <div>
      <PageHeader title="Attendance History" description="View past attendance records you've marked" />

      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs">Course</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setCourseFilter('')}>All courses</SelectItem>
              {courseList.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setStatusFilter('')}>All statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : sortedGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No attendance records found.</p>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([key, entries]) => {
            const date = key.split('|')[0];
            const courseId = key.split('|')[1];
            const present = entries.filter((e) => e.status === 'present').length;
            const absent = entries.filter((e) => e.status === 'absent').length;
            const late = entries.filter((e) => e.status === 'late').length;
            const excused = entries.filter((e) => e.status === 'excused').length;

            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{getCourseName(courseId)}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950">Present: {present}</Badge>
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950">Absent: {absent}</Badge>
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950">Late: {late}</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950">Excused: {excused}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y text-sm">
                    {entries.map((e) => (
                      <div key={String(e.id)} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{getStudentName(String(e.studentId))}</span>
                        </div>
                        <Badge className={statusBadge[String(e.status) as keyof typeof statusBadge] ?? ''}>
                          {String(e.status).charAt(0).toUpperCase() + String(e.status).slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}