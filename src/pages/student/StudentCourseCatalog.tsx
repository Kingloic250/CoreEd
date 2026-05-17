import { useMemo } from 'react';
import { BookOpen, Check, X, Loader2, GraduationCap, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { useSelfEnroll, useSelfUnenroll } from '@/hooks/useCourses';

type Course = Record<string, unknown>;
type Lecturer = Record<string, unknown>;
type Department = { id: string; name: string };

export function StudentCourseCatalog() {
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();
  const enrollMutation = useSelfEnroll();
  const unenrollMutation = useSelfUnenroll();

  const coursesList = (courses as Course[]) ?? [];
  const lecturersList = (lecturers as Lecturer[]) ?? [];
  const departmentsList = ((departments ?? []) as Department[]);

  const studentId = user?.id;

  const getLecturerName = (id: string) => {
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${String(l.firstName)} ${String(l.lastName)}` : 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    const d = departmentsList.find((d) => d.id === id);
    return d ? d.name : id;
  };

  const isEnrolled = (course: Course) => {
    return ((course.studentIds as string[]) ?? []).includes(studentId);
  };

  const isPending = (courseId: string) =>
    enrollMutation.isPending && enrollMutation.variables?.courseId === courseId ||
    unenrollMutation.isPending && unenrollMutation.variables?.courseId === courseId;

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-sm text-muted-foreground">Browse and enroll in available courses</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Course Catalog</h1>
        <p className="text-sm text-muted-foreground">Browse and enroll in available courses</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coursesList.map((course) => {
          const enrolled = isEnrolled(course);
          const pending = isPending(String(course.id));
          return (
            <Card key={String(course.id)} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{String(course.name)}</CardTitle>
                  {enrolled && (
                    <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                      <Check className="size-3 mr-0.5" /> Enrolled
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
              </CardContent>
              <CardFooter className="mt-auto pt-0">
                {enrolled ? (
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => unenrollMutation.mutate({ courseId: String(course.id), studentId })}
                    disabled={pending}
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                    {pending ? 'Unenrolling...' : 'Unenroll'}
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-1.5"
                    onClick={() => enrollMutation.mutate({ courseId: String(course.id), studentId })}
                    disabled={pending}
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BookOpen className="size-3.5" />}
                    {pending ? 'Enrolling...' : 'Enroll'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {coursesList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="size-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No courses available</p>
        </div>
      )}
    </div>
  );
}
