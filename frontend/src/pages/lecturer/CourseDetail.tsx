import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Clock, BookOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourse } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetGroups } from '@/hooks/useGroups';
import { getInitials } from '@/utils/formatters';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useGetCourse(id);
  const { data: students, isLoading: studentsLoading } = useGetStudents({});

  const c = course as Record<string, unknown> | undefined;
  const allStudents = (students as Record<string, unknown>[]) ?? [];
  const { data: courseGroups } = useGetGroups(id ? { courseId: id } : undefined);
  const enrolledIds = useMemo(() => {
    if (!courseGroups) return [];
    const set = new Set<string>();
    for (const g of courseGroups as { enrolledStudentIds: string[] }[]) {
      for (const sid of (g.enrolledStudentIds ?? [])) set.add(sid);
    }
    return [...set];
  }, [courseGroups]);
  const enrolledStudents = allStudents.filter((s) => enrolledIds.includes(String(s.id)));
  const schedule = useMemo(() => {
    if (!courseGroups) return [];
    const slots: { day: string; startTime: string; endTime: string }[] = [];
    for (const g of courseGroups as { name: string; schedule: { day: string; startTime: string; endTime: string }[] }[]) {
      for (const s of (g.schedule ?? [])) {
        slots.push({ ...s, day: `${s.day} (${g.name})` });
      }
    }
    return slots;
  }, [courseGroups]);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/lecturer/courses')}>
        <ArrowLeft className="size-4 mr-1" /> Back to My Courses
      </Button>

      {courseLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      ) : !c ? (
        <p className="text-muted-foreground">Course not found.</p>
      ) : (
        <>
          <PageHeader
            title={String(c.name)}
            description={`${String(c.year)} — ${enrolledStudents.length} enrolled students`}
          />

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
                    <Users className="size-4 shrink-0" />
                    <span>{enrolledStudents.length} students</span>
                  </div>

                  {courseGroups && (courseGroups as { name: string; schedule: { day: string; startTime: string; endTime: string }[] }[]).length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-foreground mb-2">Group Schedules</p>
                      {(courseGroups as { name: string; schedule: { day: string; startTime: string; endTime: string }[] }[]).map((g) => (
                        <div key={g.name} className="mb-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{g.name}</p>
                          {g.schedule.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-muted-foreground">{DAYS[Number(s.day)] ?? s.day}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {s.startTime}–{s.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="size-4" />
                    Student Roster
                    <Badge variant="secondary" className="ml-auto">{enrolledStudents.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : enrolledStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No students enrolled.</p>
                  ) : (
                    <div className="divide-y">
                        {enrolledStudents.map((s, idx) => (
                        <div key={String(s.id)} className="flex items-center gap-3 py-3">
                          <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(`${String(s.firstName)} ${String(s.lastName)}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {String(s.firstName)} {String(s.lastName)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" /> {String(s.email)}
                            </p>
                          </div>
                          {(s.studentNumber as string) && (
                            <Badge variant="outline" className="shrink-0 font-mono text-xs">
                              {String(s.studentNumber)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="shrink-0">{String(s.year)}</Badge>
                        </div>
                      ))}
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