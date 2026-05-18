import { useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarDays, BookOpen, User, Pencil, Check, X, CheckCheck, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAttendance, useUpdateAttendance } from '@/hooks/useAttendance';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';
import { attendanceStatusBadge as statusBadge } from '@/utils/formatters';
import { useState } from 'react';

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

export function AttendanceHistory() {
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editEntries, setEditEntries] = useState<Record<string, string>>({});
  const [editSearch, setEditSearch] = useState('');

  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;

  const { data: courses } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const { data: students } = useGetStudents({});
  const { data: attendance, isLoading } = useGetAttendance(
    lecturerId ? { markedBy: String(lecturerId) } : undefined
  );
  const updateMutation = useUpdateAttendance();

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const studentList = (students as Record<string, unknown>[]) ?? [];
  const records = (attendance as Record<string, unknown>[]) ?? [];

  const getCourseName = (courseId: string) =>
    courseList.find((c) => String(c.id) === courseId)?.name as string ?? courseId;
  const getStudentName = (studentId: string) => {
    const s = studentList.find((s) => String(s.id) === studentId);
    return s ? `${String(s.firstName)} ${String(s.lastName)}` : studentId;
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof records>();
    const filtered = records.filter((r) => {
      if (courseFilter && courseFilter !== 'all' && String(r.courseId) !== courseFilter) return false;
      if (statusFilter && statusFilter !== 'all' && String(r.status) !== statusFilter) return false;
      if (dateFilter && String(r.date) !== dateFilter) return false;
      return true;
    });
    for (const r of filtered) {
      const key = `${r.date}|${r.courseId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return groups;
  }, [records, courseFilter, statusFilter, dateFilter]);

  const sortedGroups = useMemo(
    () => [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0])),
    [grouped]
  );

  const startEditing = (key: string, entries: Record<string, unknown>[]) => {
    const statusMap: Record<string, string> = {};
    for (const e of entries) {
      statusMap[String(e.id)] = String(e.status);
    }
    setEditEntries(statusMap);
    setEditingKey(key);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditEntries({});
    setEditSearch('');
  };

  const setAllStatus = (status: string) => {
    setEditEntries((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = status;
      }
      return next;
    });
  };

  const saveEditing = async () => {
    if (!editingKey) return;
    const ids = Object.keys(editEntries);
    await Promise.all(
      ids.map((id) =>
        updateMutation.mutateAsync({ id, status: editEntries[id] })
      )
    );
    cancelEditing();
  };

  const hasChanges = (entries: Record<string, unknown>[]) => {
    if (!editingKey) return false;
    return entries.some((e) => editEntries[String(e.id)] !== String(e.status));
  };

  return (
    <div>
      <PageHeader title="Attendance History" description="View and edit past attendance records" />

      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs">Course</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
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
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 w-full sm:w-40 text-xs"
          />
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
            const isEditing = editingKey === key;
            const present = entries.filter((e) => e.status === 'present').length;
            const absent = entries.filter((e) => e.status === 'absent').length;
            const late = entries.filter((e) => e.status === 'late').length;
            const excused = entries.filter((e) => e.status === 'excused').length;

            const currentStatuses: Record<string, string> = {};
            for (const e of entries) {
              currentStatuses[String(e.id)] = String(e.status);
            }

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
                    {!isEditing ? (
                      <Button variant="ghost" size="icon-sm" onClick={() => startEditing(key, entries)} aria-label="Edit attendance">
                        <Pencil className="size-3.5" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={cancelEditing} aria-label="Cancel">
                          <X className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="default" size="icon-sm" onClick={saveEditing} disabled={updateMutation.isPending || !hasChanges(entries)} aria-label="Save">
                          {updateMutation.isPending ? (
                            <span className="size-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {isEditing && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-4 py-3 border-b sticky top-0 bg-card z-10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCheck className="size-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Bulk set:</span>
                          {ATTENDANCE_STATUSES.map((s) => (
                            <Button key={s} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAllStatus(s)}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </Button>
                          ))}
                        </div>
                        <div className="relative sm:ml-auto w-full sm:w-auto">
                          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={editSearch}
                            onChange={(e) => setEditSearch(e.target.value)}
                            className="h-7 w-full sm:w-48 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:border-ring"
                          />
                        </div>
                      </div>
                    )}
                    <div className="divide-y text-sm px-4">
                    {entries
                      .filter((e) => {
                        if (!editSearch) return true;
                        const name = getStudentName(String(e.studentId)).toLowerCase();
                        return name.includes(editSearch.toLowerCase());
                      })
                      .map((e) => (
                      <div key={String(e.id)} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <User className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{getStudentName(String(e.studentId))}</span>
                        </div>
                        {isEditing ? (
                          <Select
                            value={editEntries[String(e.id)] ?? String(e.status)}
                            onValueChange={(v) => setEditEntries((prev) => ({ ...prev, [String(e.id)]: v }))}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Change status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  <span className="flex items-center gap-1.5">
                                    <span className={`size-1.5 rounded-full ${
                                      s === 'present' ? 'bg-emerald-500' :
                                      s === 'absent' ? 'bg-red-500' :
                                      s === 'late' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`} />
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={statusBadge[String(e.status) as keyof typeof statusBadge] ?? ''}>
                            {String(e.status).charAt(0).toUpperCase() + String(e.status).slice(1)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                  {isEditing && (
                    <div className="px-4 py-3 border-t">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                        <Button size="sm" onClick={saveEditing} disabled={updateMutation.isPending || !hasChanges(entries)}>
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
