// Student dashboard: welcome, quick stats, announcements, recent grades
import { format } from 'date-fns';
import { BookOpen, Calendar, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetAttendance } from '@/hooks/useAttendance';
import { useGetAnnouncements } from '@/hooks/useAnnouncements';
import { getGradeColor } from '@/utils/formatters';

export function StudentDashboard() {
  const { user } = useAuth();
  const { data: grades, isLoading: gradesLoading } = useGetGrades({ studentId: user?.id });
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendance({ studentId: user?.id });
  const { data: announcements, isLoading: announcementsLoading } = useGetAnnouncements();

  const gradesList = (grades as Record<string, unknown>[]) ?? [];
  const attendanceList = (attendance as Record<string, unknown>[]) ?? [];
  const announcementsList = (announcements as Record<string, unknown>[]) ?? [];

  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const attendancePct = attendanceList.length > 0 ? Math.round((presentCount / attendanceList.length) * 100) : 0;
  const avgScore = gradesList.length > 0
    ? Math.round(gradesList.reduce((sum, g) => sum + Number(g.score), 0) / gradesList.length)
    : 0;

  const recentGrades = gradesList.slice(0, 5);
  const recentAnnouncements = announcementsList.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-foreground text-background p-6">
        <p className="text-background/60 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-background/60 text-sm mt-1">Keep up the great work!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="size-4 text-primary" />
              </div>
              <div>
                {attendanceLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-xl font-bold">{attendancePct}%</p>
                )}
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-primary" />
              </div>
              <div>
                {gradesLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-xl font-bold">{avgScore}%</p>
                )}
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="size-4 text-primary" />
              </div>
              <div>
                {gradesLoading ? <Skeleton className="h-6 w-12" /> : (
                  <p className="text-xl font-bold">{gradesList.length}</p>
                )}
                <p className="text-xs text-muted-foreground">Grades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentGrades.map((g) => (
                  <div key={String(g.id)} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium">{String(g.subject)}</p>
                      <p className="text-xs text-muted-foreground">{String(g.term)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{String(g.score)}/{String(g.maxScore)}</span>
                      <Badge variant="outline" className={getGradeColor(String(g.grade))}>
                        {String(g.grade)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-4" />
              <CardTitle className="text-base">Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {announcementsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements.</p>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={String(a.id)} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{String(a.title)}</p>
                      {a.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs shrink-0">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{String(a.message)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
