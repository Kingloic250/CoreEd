import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookOpen, ClipboardList, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = DAYS[new Date().getDay()];
  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;
  const { data: courses, isLoading: coursesLoading } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const { data: grades, isLoading: gradesLoading } = useGetGrades({ courseId: undefined });

  const myCourses = (courses as Record<string, unknown>[]) ?? [];
  const todayCourses = myCourses.filter((c) =>
    (c.schedule as Record<string, string>[])?.some((s) => s.day === today)
  );

  const recentGrades = ((grades as Record<string, unknown>[]) ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-foreground text-background p-6">
        <p className="text-background/60 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-background/60 text-sm mt-1">
          You have {todayCourses.length} {todayCourses.length === 1 ? 'course' : 'courses'} scheduled today.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Today&apos;s Schedule</h2>
        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : todayCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No courses scheduled for today.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {todayCourses.map((c) => {
              const todaySlot = (c.schedule as Record<string, string>[])?.find((s) => s.day === today);
              return (
                <Card key={String(c.id)}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{String(c.name)}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{String(c.room)}</span>
                          <span className="flex items-center gap-1"><Users className="size-3" />{(c.studentIds as string[])?.length} students</span>
                          {todaySlot && <span className="flex items-center gap-1"><Clock className="size-3" />{todaySlot.startTime}–{todaySlot.endTime}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary">{String(c.year)}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => navigate('/lecturer/attendance')}
                    >
                      <ClipboardList className="size-3.5" /> Mark Attendance
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">All My Courses</h2>
        {coursesLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {myCourses.map((c) => (
              <Card key={String(c.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{String(c.name)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><Users className="size-3" /> {(c.studentIds as string[])?.length ?? 0} students</p>
                  <p className="flex items-center gap-1"><MapPin className="size-3" /> Room {String(c.room)}</p>
                  <p className="flex items-center gap-1"><BookOpen className="size-3" /> {String(c.year)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Grades Entered</CardTitle>
        </CardHeader>
        <CardContent>
          {gradesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : recentGrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grades entered yet.</p>
          ) : (
            <div className="space-y-2">
              {recentGrades.map((g) => (
                <div key={String(g.id)} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{String(g.subject)} — {String(g.semester)}</span>
                  <Badge variant="outline">{String(g.grade)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
