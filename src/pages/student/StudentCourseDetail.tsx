import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, BookOpen, GraduationCap, BarChart3, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourse } from '@/hooks/useCourses';
import { useGetCurrentStudent } from '@/hooks/useStudents';
import { useGetGrades } from '@/hooks/useGrades';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function StudentCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useGetCourse(id);
  const { data: currentStudent } = useGetCurrentStudent();
  const studentId = currentStudent ? (currentStudent as Record<string, unknown>).id as string : undefined;

  const { data: grades } = useGetGrades(
    id && studentId ? { courseId: id, studentId } : { courseId: '', studentId: '' },
  );

  const c = course as Record<string, unknown> | undefined;
  const schedule = (c?.schedule as Record<string, string>[]) ?? [];
  const gradingComponents = (c?.gradingComponents as Record<string, unknown>[]) ?? [];
  const enrolledIds = (c?.studentIds as string[]) ?? [];
  const isEnrolled = studentId ? enrolledIds.includes(studentId) : false;
  const myGrade = (grades as Record<string, unknown>[])?.[0] ?? null;
  const componentScores = (myGrade?.componentScores as Record<string, number>) ?? {};

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/student/courses')}>
        <ArrowLeft className="size-4 mr-1" /> Back to Course Catalog
      </Button>

      {courseLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : !c ? (
        <p className="text-muted-foreground">Course not found.</p>
      ) : (
        <>
          <PageHeader title={String(c.name)} description={String(c.year ?? '')} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Course Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="size-4 shrink-0" />
                    <span>{String(c.year)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    <span>Room {String(c.room)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="size-4 shrink-0" />
                    <span>{isEnrolled ? 'Enrolled' : 'Not enrolled'}</span>
                  </div>

                  {schedule.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-foreground mb-2">Schedule</p>
                      {DAYS.filter((d) => schedule.some((s) => s.day === d)).map((day) => {
                        const slot = schedule.find((s) => s.day === day);
                        return slot ? (
                          <div key={day} className="flex items-center justify-between text-xs py-1">
                            <span className="text-muted-foreground">{day}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {slot.startTime}–{slot.endTime}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {gradingComponents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="size-4" />
                      Grading Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {gradingComponents.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{String(comp.name)}</span>
                        <span className="text-xs">
                          {String(comp.maxScore)} pts — {String(comp.weight)}%
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="size-4" />
                    My Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isEnrolled ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      You are not enrolled in this course. Browse the course catalog to enroll.
                    </p>
                  ) : !myGrade ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No grades have been published yet for this course.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {componentScores && Object.keys(componentScores).length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Component Scores
                          </p>
                          <div className="divide-y rounded-lg border">
                            {Object.entries(componentScores).map(([compName, score]) => {
                              const compDef = gradingComponents.find(
                                (gc) => String(gc.name) === compName
                              );
                              const maxScore = compDef ? Number(compDef.maxScore) : 100;
                              const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                              return (
                                <div key={compName} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                  <span className="text-muted-foreground">{compName}</span>
                                  <span className="font-medium">
                                    {score}/{maxScore}
                                    <span className="text-muted-foreground ml-2 text-xs">({pct}%)</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-5 py-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            Overall Score
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-0.5">
                            {Number(myGrade.score).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            Letter Grade
                          </p>
                          <p className={`text-3xl font-bold mt-0.5 ${
                            (myGrade.grade as string)?.startsWith('A')
                              ? 'text-green-600 dark:text-green-400'
                              : (myGrade.grade as string)?.startsWith('B')
                              ? 'text-blue-600 dark:text-blue-400'
                              : (myGrade.grade as string)?.startsWith('C')
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {String(myGrade.grade)}
                          </p>
                        </div>
                      </div>

                      {myGrade.comments && String(myGrade.comments).trim() && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Comments</p>
                          <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg px-4 py-2.5 italic">
                            &ldquo;{String(myGrade.comments)}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}