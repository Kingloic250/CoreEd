import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, X, Loader2, GraduationCap, User, Building2, ChevronRight,
  CheckCircle2, AlertCircle, RotateCcw, Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { useGetGroups } from '@/hooks/useGroups';
import { useEnrollStudent, useUnenrollStudent, useMyEnrollments } from '@/hooks/useEnroll';
import { getGradeColor } from '@/utils/formatters';

type Course = Record<string, unknown>;
type Student = Record<string, unknown>;

const TABS = [
  { key: 'available', label: 'Available', icon: BookOpen },
  { key: 'enrolled', label: 'Currently Enrolled', icon: GraduationCap },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'failed', label: 'Failed', icon: AlertCircle },
] as const;

export function StudentCourseCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: grades } = useGetGrades({ studentId: user?.id });
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();
  const { data: myEnrollments, refetch: refetchEnrollments } = useMyEnrollments(user?.id);
  const enrollMutation = useEnrollStudent();
  const unenrollMutation = useUnenrollStudent();

  const coursesList = (courses as Course[]) ?? [];
  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const lecturersList = (lecturers as Record<string, unknown>[]) ?? [];
  const departmentsList = ((departments ?? []) as { id: string; name: string }[]);
  const enrolledGroupIds = (myEnrollments?.groups ?? []).map((g: Record<string, unknown>) => g.courseId as string);
  const legacyCourseIds = (myEnrollments?.courses ?? []).map((c: Record<string, unknown>) => c.id as string);
  const enrolledCourseIds = [...new Set([...enrolledGroupIds, ...legacyCourseIds])];

  const studentId = user?.id;
  const [tab, setTab] = useState('available');

  // Group selection dialog
  const [enrollDialog, setEnrollDialog] = useState<{ courseId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const { data: groupsData } = useGetGroups(
    enrollDialog ? { courseId: enrollDialog.courseId } : undefined
  );
  const groups = (groupsData ?? []) as {
    id: string; name: string; capacity: number; enrolledCount: number;
    courseId: string; room: { name: string } | null;
  }[];

  const getLecturerName = (id: string) => {
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${String(l.firstName)} ${String(l.lastName)}` : 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    const d = departmentsList.find((d) => d.id === id);
    return d ? d.name : id;
  };

  const categorized = useMemo(() => {
    const available: Course[] = [];
    const enrolled: Course[] = [];
    const completed: Course[] = [];
    const failed: Course[] = [];

    coursesList.forEach((course) => {
      const isEnrolledIn = enrolledCourseIds.includes(course.id as string);
      if (!isEnrolledIn) {
        available.push(course);
        return;
      }

      const courseGrades = allGrades.filter(
        (g) => String(g.courseId) === String(course.id)
      );

      if (courseGrades.length === 0) {
        enrolled.push(course);
      } else {
        const hasF = courseGrades.some((g) => String(g.grade) === 'F');
        if (hasF) {
          failed.push(course);
        } else {
          completed.push(course);
        }
      }
    });

    return { available, enrolled, completed, failed };
  }, [coursesList, allGrades, enrolledCourseIds]);

  const getLatestGrade = (courseId: string) => {
    const courseGrades = allGrades
      .filter((g) => String(g.courseId) === courseId)
      .sort((a, b) => String(b.semester ?? '').localeCompare(String(a.semester ?? '')));
    return courseGrades[0] ?? null;
  };

  const handleEnroll = () => {
    if (!enrollDialog || !selectedGroupId || !studentId) return;
    enrollMutation.mutate(
      { courseId: enrollDialog.courseId, groupId: selectedGroupId, studentId },
      {
        onSuccess: () => {
          setEnrollDialog(null);
          setSelectedGroupId('');
          refetchEnrollments();
        },
      }
    );
  };

  const handleUnenroll = (courseId: string) => {
    if (!studentId) return;
    unenrollMutation.mutate(
      { courseId, studentId },
      {
        onSuccess: () => refetchEnrollments(),
      }
    );
  };

  const tabCourses = categorized[tab as keyof typeof categorized];

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">Browse, enroll, and track your courses</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent>
              <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">Browse, enroll, and track your courses</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <t.icon className="size-3.5" />
              {t.label}
              {categorized[t.key as keyof typeof categorized].length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {categorized[t.key as keyof typeof categorized].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {tabCourses.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <t.icon className="size-10 text-muted-foreground/30" />
                    <p className="text-sm">
                      {t.key === 'available' && 'No available courses to enroll in.'}
                      {t.key === 'enrolled' && 'You are not currently enrolled in any courses.'}
                      {t.key === 'completed' && 'No completed courses yet.'}
                      {t.key === 'failed' && 'No failed courses. Keep up the good work!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tabCourses.map((course) => {
                  const grade = getLatestGrade(String(course.id));
                  const gradeLetter = grade ? String(grade.grade) : null;
                  const pending = enrollMutation.isPending || unenrollMutation.isPending;

                  return (
                    <Card key={String(course.id)} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle
                            className="text-base hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                          >
                            {String(course.name)}
                          </CardTitle>

                          {t.key === 'enrolled' && (
                            <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                              In Progress
                            </Badge>
                          )}
                          {t.key === 'completed' && gradeLetter && (
                            <Badge variant="outline" className={`shrink-0 ${getGradeColor(gradeLetter)}`}>
                              {gradeLetter}
                            </Badge>
                          )}
                          {t.key === 'failed' && (
                            <Badge variant="destructive" className="shrink-0">F</Badge>
                          )}
                        </div>
                        <CardDescription className="flex flex-col gap-1 mt-1">
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                            {String(course.year)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                            {getDepartmentName(String(course.department))}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            {getLecturerName(String(course.lecturerId))}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 text-xs text-muted-foreground">
                        {String(course.room)} · {String(course.credits)} credits
                        {grade && (
                          <span className="ml-1">
                            · Score: {Number(grade.score)}/{Number(grade.maxScore)}
                          </span>
                        )}
                      </CardContent>
                      <CardFooter className="mt-auto pt-0 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                        >
                          Details <ChevronRight className="size-3" />
                        </Button>

                        {t.key === 'available' && (
                          <Button
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => setEnrollDialog({ courseId: String(course.id) })}
                          >
                            <BookOpen className="size-3.5" /> Enroll
                          </Button>
                        )}
                        {t.key === 'enrolled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => handleUnenroll(String(course.id))}
                            disabled={pending}
                          >
                            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                            {pending ? 'Unenrolling...' : 'Unenroll'}
                          </Button>
                        )}
                        {t.key === 'failed' && (
                          <Button
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => setEnrollDialog({ courseId: String(course.id) })}
                          >
                            <RotateCcw className="size-3.5" /> Retake
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Group Selection Dialog */}
      <Dialog open={!!enrollDialog} onOpenChange={(v) => { if (!v) { setEnrollDialog(null); setSelectedGroupId(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Group</DialogTitle>
            <DialogDescription>Choose a group to enroll in this course.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No groups available for this course.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => {
                  const full = g.enrolledCount >= g.capacity;
                  return (
                    <label
                      key={g.id}
                      className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedGroupId === g.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      } ${full ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="group"
                        value={g.id}
                        checked={selectedGroupId === g.id}
                        onChange={() => setSelectedGroupId(g.id)}
                        disabled={full}
                        className="size-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{g.name}</span>
                          <Users className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {g.enrolledCount}/{g.capacity}
                          </span>
                        </div>
                        {g.room && <p className="text-xs text-muted-foreground">{g.room.name}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEnrollDialog(null); setSelectedGroupId(''); }}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={!selectedGroupId || enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
