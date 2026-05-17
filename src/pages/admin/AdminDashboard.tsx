// Admin dashboard: stat cards, activity feed, attendance chart
import { Users, GraduationCap, BookOpen, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetTeachers } from '@/hooks/useTeachers';
import { useGetClasses } from '@/hooks/useClasses';
import { useGetAnnouncements } from '@/hooks/useAnnouncements';
import { formatDate } from '@/utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const weeklyAttendance = [
  { day: 'Mon', present: 42, absent: 8 },
  { day: 'Tue', present: 45, absent: 5 },
  { day: 'Wed', present: 38, absent: 12 },
  { day: 'Thu', present: 44, absent: 6 },
  { day: 'Fri', present: 40, absent: 10 },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: students, isLoading: studentsLoading } = useGetStudents();
  const { data: teachers, isLoading: teachersLoading } = useGetTeachers();
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: announcements } = useGetAnnouncements();

  const totalStudents = (students as unknown[])?.length ?? 0;
  const totalTeachers = (teachers as unknown[])?.length ?? 0;
  const totalClasses = (classes as unknown[])?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, here is what is happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {studentsLoading ? <LoadingSpinner /> : (
          <StatCard title="Total Students" value={totalStudents} icon={GraduationCap} trend="up" trendValue="+3 this month" />
        )}
        {teachersLoading ? <LoadingSpinner /> : (
          <StatCard title="Total Teachers" value={totalTeachers} icon={Users} trend="neutral" trendValue="No change" />
        )}
        {classesLoading ? <LoadingSpinner /> : (
          <StatCard title="Total Classes" value={totalClasses} icon={BookOpen} trend="neutral" trendValue="No change" />
        )}
        <StatCard title="Attendance Rate" value={87} icon={TrendingUp} trend="up" trendValue="+2% vs last week" suffix="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyAttendance} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="present" name="Present" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="var(--muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Announcements</CardTitle>
            <Badge variant="secondary">{(announcements as unknown[])?.length ?? 0}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {((announcements as Record<string, unknown>[]) ?? []).slice(0, 4).map((ann) => (
              <div key={String(ann.id)} className="flex items-start gap-2">
                <Badge
                  variant={ann.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-[10px] shrink-0 mt-0.5"
                >
                  {String(ann.priority)}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{String(ann.title)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(String(ann.createdAt))}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/admin/students')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Student
          </Button>
          <Button onClick={() => navigate('/admin/teachers')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Teacher
          </Button>
          <Button onClick={() => navigate('/admin/classes')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Class
          </Button>
          <Button onClick={() => navigate('/admin/reports')} variant="outline" className="gap-2">
            <TrendingUp className="size-4" /> View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
