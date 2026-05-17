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
import { getInitials } from '@/utils/formatters';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useGetCourse(id);
  const { data: students, isLoading: studentsLoading } = useGetStudents({});

  const c = course as Record<string, unknown> | undefined;
  const schedule = (c?.schedule as Record<string, string>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];
  const enrolledIds = (c?.studentIds as string[]) ?? [];
  const enrolledStudents = allStudents.filter((s) => enrolledIds.includes(String(s.id)));

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