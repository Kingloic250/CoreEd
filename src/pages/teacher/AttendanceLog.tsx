// Teacher: mark attendance for a class on a given date
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
import { useGetClasses } from '@/hooks/useClasses';
import { useGetStudents } from '@/hooks/useStudents';
import { useMarkAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { ATTENDANCE_STATUSES } from '@/utils/constants';
import { attendanceStatusBadge as attendanceStatusBadgeMap } from '@/utils/formatters';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type StatusEntry = { studentId: string; status: AttendanceStatus };

export function AttendanceLog() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: students, isLoading: studentsLoading } = useGetStudents({});
  const markMutation = useMarkAttendance();

  const classList = (classes as Record<string, unknown>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];

  const selectedClassData = classList.find((c) => String(c.id) === selectedClass);
  const classStudentIds = (selectedClassData?.studentIds as string[]) ?? [];
  const classStudents = allStudents.filter((s) => classStudentIds.includes(String(s.id)));

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass) { toast.error('Please select a class'); return; }
    if (classStudents.length === 0) { toast.error('No students in this class'); return; }

    const entries: StatusEntry[] = classStudents.map((s) => ({
      studentId: String(s.id),
      status: statuses[String(s.id)] ?? 'present',
    }));

    try {
      await markMutation.mutateAsync({
        classId: selectedClass,
        date,
        entries,
        markedBy: user?.id ?? '',
      });
      toast.success('Attendance saved successfully');
    } catch {
      toast.error('Failed to save attendance');
    }
  };

  const presentCount = classStudents.filter((s) => (statuses[String(s.id)] ?? 'present') === 'present').length;
  const absentCount = classStudents.filter((s) => statuses[String(s.id)] === 'absent').length;

  return (
    <div>
      <PageHeader title="Attendance Log" description="Mark daily attendance for your classes" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Class & Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class</Label>
                {classesLoading ? (
                  <Skeleton className="h-9" />
                ) : (
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger aria-label="Select class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classList.map((cls) => (
                        <SelectItem key={String(cls.id)} value={String(cls.id)}>
                          {String(cls.name)}
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

        {selectedClass && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {String(selectedClassData?.name)} — {format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
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
              ) : classStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students enrolled in this class.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map((student, idx) => {
                    const sid = String(student.id);
                    const currentStatus = statuses[sid] ?? 'present';
                    return (
                      <div
                        key={sid}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6 text-right">{idx + 1}.</span>
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

              {classStudents.length > 0 && (
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
