import { useMemo } from 'react';
import { GraduationCap, BookOpen, Calendar, Award, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetStudentProgram } from '@/hooks/usePrograms';
import { useAuth } from '@/hooks/useAuth';
import { useGetGrades } from '@/hooks/useGrades';

export function MyProgram() {
  const { user } = useAuth();
  const { data: enrollment, isLoading } = useGetStudentProgram(user?.id ?? '');
  const { data: grades } = useGetGrades({ studentId: user?.id });

  const program = (enrollment as Record<string, unknown> | undefined)?.program as Record<string, unknown> | undefined;
  const curriculumData = (enrollment as Record<string, unknown> | undefined)?.curriculum as Record<string, unknown> | undefined;
  const activeCurriculum = (curriculumData ?? (program?.curricula as Record<string, unknown>[] | undefined)?.[0]) as Record<string, unknown> | undefined;
  const courses = (activeCurriculum?.courses ?? []) as Record<string, unknown>[];
  const allGrades = (grades ?? []) as Record<string, unknown>[];

  const stats = useMemo(() => {
    const total = courses.length;
    const core = courses.filter((c) => c.isCore).length;
    const electives = total - core;
    const completedCourses = allGrades.filter((g) => g.status === 'approved').length;
    const totalCredits = courses.reduce((s, c) => s + Number((c.course as Record<string, unknown> | undefined)?.credits ?? 3), 0);
    const earnedCredits = allGrades
      .filter((g) => g.status === 'approved')
      .reduce((s, g) => s + Number((g as Record<string, unknown>).credits ?? 0), 0);
    return { total, core, electives, completedCourses, totalCredits, earnedCredits };
  }, [courses, allGrades]);

  const coursesByYear = useMemo(() => {
    const map: Record<number, Record<string, unknown>[]> = {};
    for (const c of courses) {
      const y = Number(c.year);
      if (!map[y]) map[y] = [];
      map[y].push(c);
    }
    return map;
  }, [courses]);

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  if (!enrollment) {
    return (
      <div>
        <PageHeader title="My Program" description="Your degree program and curriculum" />
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">You are not enrolled in any program. Contact the administration.</CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Program" description="Track your degree progress" />

      {/* Program info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{String(program?.name ?? '')}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Badge variant="secondary" className="text-xs">{String(program?.degreeType ?? '')}</Badge>
                  <span>{String(program?.durationYears ?? 4)} years</span>
                  <span>&middot;</span>
                  <span>{String(activeCurriculum?.name ?? '')}</span>
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <Award className="size-3" />
                {String(program?.totalCreditsRequired ?? 120)} credits required
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300">
                <CheckCircle2 className="size-3" />
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{stats.completedCourses}/{stats.total}</p>
            <p className="text-xs text-muted-foreground">Courses Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{stats.earnedCredits}/{stats.totalCredits}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{stats.core}/{stats.electives}</p>
            <p className="text-xs text-muted-foreground">Core / Elective</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress bar */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Degree Progress</span>
            <span className="text-sm text-muted-foreground">{stats.total > 0 ? Math.round((stats.completedCourses / stats.total) * 100) : 0}%</span>
          </div>
          <Progress value={stats.total > 0 ? (stats.completedCourses / stats.total) * 100 : 0} />
        </CardContent>
      </Card>

      {/* Curriculum by year */}
      <h3 className="font-semibold mb-4">Curriculum Overview</h3>
      <div className="space-y-6">
        {Object.entries(coursesByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, pcs]) => (
          <Card key={year}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Year {year}</CardTitle></CardHeader>
            <CardContent>
              {[1, 2].map((sem) => {
                const semCourses = pcs.filter((pc) => Number(pc.semester) === sem);
                if (semCourses.length === 0) return null;
                return (
                  <div key={sem} className="mb-4 last:mb-0">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Semester {sem}</p>
                    <div className="space-y-1.5">
                      {semCourses.map((pc) => {
                        const course = pc.course as Record<string, unknown> | undefined;
                        const grade = allGrades.find((g) => g.courseId === course?.id && g.status === 'approved');
                        return (
                          <div key={String(pc.id)} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{String(course?.name ?? '')}</span>
                              <Badge variant="outline" className="text-xs shrink-0">{String(course?.credits ?? 3)} cr</Badge>
                              {pc.isCore ? (
                                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0">Core</Badge>
                              ) : (
                                <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0">Elective</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {grade ? (
                                <Badge variant="outline" className={`text-xs ${String((grade as Record<string, unknown>).grade) === 'F' ? 'text-destructive' : 'text-emerald-600'}`}>
                                  <CheckCircle2 className="size-3 mr-1" />
                                  {String(grade.grade ?? '')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                                  <Clock className="size-3" /> Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
