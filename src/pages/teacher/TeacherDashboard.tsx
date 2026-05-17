// Teacher dashboard: welcome, classes, quick attendance
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookOpen, ClipboardList, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetClasses } from '@/hooks/useClasses';
import { useGetGrades } from '@/hooks/useGrades';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = DAYS[new Date().getDay()];
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: grades, isLoading: gradesLoading } = useGetGrades({ classId: undefined });

  // Filter classes assigned to this teacher (mock: show all since we use mock data)
  const myClasses = (classes as Record<string, unknown>[]) ?? [];
  const todayClasses = myClasses.filter((cls) =>
    (cls.schedule as Record<string, string>[])?.some((s) => s.day === today)
  );

  const recentGrades = ((grades as Record<string, unknown>[]) ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-foreground text-background p-6">
        <p className="text-background/60 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-background/60 text-sm mt-1">
          You have {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled today.
        </p>
      </div>

      {/* Today's Classes */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Today&apos;s Schedule</h2>
        {classesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : todayClasses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No classes scheduled for today.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {todayClasses.map((cls) => {
              const todaySlot = (cls.schedule as Record<string, string>[])?.find((s) => s.day === today);
              return (
                <Card key={String(cls.id)}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{String(cls.name)}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{String(cls.room)}</span>
                          <span className="flex items-center gap-1"><Users className="size-3" />{(cls.studentIds as string[])?.length} students</span>
                          {todaySlot && <span className="flex items-center gap-1"><Clock className="size-3" />{todaySlot.startTime}–{todaySlot.endTime}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary">{String(cls.gradeLevel)}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => navigate('/teacher/attendance')}
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

      {/* All Classes */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">All My Classes</h2>
        {classesLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {myClasses.map((cls) => (
              <Card key={String(cls.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{String(cls.name)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><Users className="size-3" /> {(cls.studentIds as string[])?.length ?? 0} students</p>
                  <p className="flex items-center gap-1"><MapPin className="size-3" /> Room {String(cls.room)}</p>
                  <p className="flex items-center gap-1"><BookOpen className="size-3" /> {String(cls.gradeLevel)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent grades */}
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
                  <span className="text-muted-foreground">{String(g.subject)} — {String(g.term)}</span>
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
