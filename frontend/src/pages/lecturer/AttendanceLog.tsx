import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/ui/spinner';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useMarkAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';
import { ATTENDANCE_STATUSES } from '@/utils/constants';
import { attendanceStatusBadge as attendanceStatusBadgeMap } from '@/utils/formatters';

type AttendanceStatus = 'present' | 'absent';
type StatusEntry = { studentId: string; status: AttendanceStatus };

export function AttendanceLog() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;
  const { data: courses, isLoading: coursesLoading } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const { data: students, isLoading: studentsLoading } = useGetStudents({});
  const markMutation = useMarkAttendance();

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];

  const selectedCourseData = courseList.find((c) => String(c.id) === selectedCourse);
  const courseStudentIds = (selectedCourseData?.studentIds as string[]) ?? [];
  const courseStudents = allStudents.filter((s) => courseStudentIds.includes(String(s.id)));

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedCourse) { toast.error('Please select a course'); return; }
    if (courseStudents.length === 0) { toast.error('No students in this course'); return; }

    const entries: StatusEntry[] = courseStudents.map((s) => ({
      studentId: String(s.id),
      status: statuses[String(s.id)] ?? 'present',
    }));

    try {
      await markMutation.mutateAsync({
        courseId: selectedCourse,
        date,
        entries,
        markedBy: user?.id ?? '',
      });
      toast.success('Attendance saved successfully');
    } catch {
      toast.error('Failed to save attendance');
    }
  };

  const presentCount = courseStudents.filter((s) => (statuses[String(s.id)] ?? 'present') === 'present').length;
  const absentCount = courseStudents.filter((s) => statuses[String(s.id)] === 'absent').length;

  return (
    <div>
      <PageHeader title="Attendance Log" description="Mark daily attendance for your courses" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Course & Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Course</Label>
                {coursesLoading ? (
                  <Skeleton className="h-9" />
                ) : (
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger aria-label="Select course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseList.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {String(c.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-date">Date</Label>
                <Input
                  id="att-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCourse && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {String(selectedCourseData?.name)} — {format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
                </CardTitle>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
                    Present: {presentCount}
                  </Badge>
                  <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">
                    Absent: {absentCount}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : courseStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students enrolled in this course.</p>
              ) : (
                <div className="space-y-2">
                  {courseStudents.map((student, idx) => {
                    const sid = String(student.id);
                    const currentStatus = statuses[sid] ?? 'present';
                    return (
                      <div
                        key={sid}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6 text-right">{idx + 1}.</span>
                          {(student.studentNumber as string) && (
                            <span className="text-xs font-mono text-muted-foreground shrink-0">{String(student.studentNumber)}</span>
                          )}
                          <div>
                            <p className="text-sm font-medium">{String(student.firstName)} {String(student.lastName)}</p>
                            <p className="text-xs text-muted-foreground">{String(student.email)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {ATTENDANCE_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(sid, status as AttendanceStatus)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                currentStatus === status
                                  ? attendanceStatusBadgeMap[status] ?? ''
                                  : 'border-border text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {courseStudents.length > 0 && (
                <Button
                  className="w-full mt-4"
                  onClick={handleSubmit}
                  disabled={markMutation.isPending}
                >
                  {markMutation.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                  Save Attendance
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
