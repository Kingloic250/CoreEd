import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, X, Loader2, GraduationCap, User, Building2, ChevronRight,
  CheckCircle2, AlertCircle, RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { useSelfEnroll, useSelfUnenroll } from '@/hooks/useCourses';
import { getGradeColor } from '@/utils/formatters';

type Course = Record<string, unknown>;
type Lecturer = Record<string, unknown>;
type Department = { id: string; name: string };

const TABS = [
  { key: 'available', label: 'Available', icon: BookOpen },
  { key: 'enrolled', label: 'Currently Enrolled', icon: GraduationCap },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'failed', label: 'Failed', icon: AlertCircle },
] as const;

function isLoadingMutation(
  id: string,
  ...mutations: { isPending: boolean; variables?: { courseId: string } }[]
) {
  return mutations.some((m) => m.isPending && m.variables?.courseId === id);
}

export function StudentCourseCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: grades } = useGetGrades({ studentId: user?.id });
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();
  const enrollMutation = useSelfEnroll();
  const unenrollMutation = useSelfUnenroll();

  const coursesList = (courses as Course[]) ?? [];
  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const lecturersList = (lecturers as Lecturer[]) ?? [];
  const departmentsList = ((departments ?? []) as Department[]);

  const studentId = user?.id;

  const [tab, setTab] = useState('available');

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
      const isEnrolledIn = ((course.studentIds as string[]) ?? []).includes(studentId);
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
  }, [coursesList, allGrades, studentId]);

  const getLatestGrade = (courseId: string) => {
    const courseGrades = allGrades
      .filter((g) => String(g.courseId) === courseId)
      .sort((a, b) => String(b.semester ?? '').localeCompare(String(a.semester ?? '')));
    return courseGrades[0] ?? null;
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
                      {t.key === 'enrolled' && 'You are not currently enrolled in any courses. Browse the Available tab to find courses.'}
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
                  const pending = isLoadingMutation(
                    String(course.id),
                    enrollMutation,
                    unenrollMutation
                  );

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

                          {/* Tab-specific badges */}
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
                            <Badge variant="destructive" className="shrink-0">
                              F
                            </Badge>
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
                        {String(course.room)} · {(course.studentIds as string[])?.length ?? 0} students
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

                        {/* Tab-specific actions */}
                        {t.key === 'available' && (
                          <Button
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => enrollMutation.mutate({ courseId: String(course.id), studentId })}
                            disabled={pending}
                          >
                            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BookOpen className="size-3.5" />}
                            {pending ? 'Enrolling...' : 'Enroll'}
                          </Button>
                        )}
                        {t.key === 'enrolled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => unenrollMutation.mutate({ courseId: String(course.id), studentId })}
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
                            onClick={() => enrollMutation.mutate({ courseId: String(course.id), studentId })}
                            disabled={pending}
                          >
                            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                            {pending ? 'Retaking...' : 'Retake'}
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
    </div>
  );
}
