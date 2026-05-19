import { Users, GraduationCap, BookOpen, TrendingUp, Plus, Building2, CalendarDays, UserPlus, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetCourses } from '@/hooks/useCourses';
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
  const { data: lecturers, isLoading: lecturersLoading } = useGetLecturers();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: announcements } = useGetAnnouncements();

  const totalStudents = (students as unknown[])?.length ?? 0;
  const totalLecturers = (lecturers as unknown[])?.length ?? 0;
  const totalCourses = (courses as unknown[])?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, here is what is happening today.</p>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {studentsLoading ? <LoadingSpinner /> : (
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard title="Total Students" value={totalStudents} icon={GraduationCap} trend="up" trendValue="+3 this month" />
          </motion.div>
        )}
        {lecturersLoading ? <LoadingSpinner /> : (
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard title="Total Lecturers" value={totalLecturers} icon={Users} trend="neutral" trendValue="No change" />
          </motion.div>
        )}
        {coursesLoading ? <LoadingSpinner /> : (
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard title="Total Courses" value={totalCourses} icon={BookOpen} trend="neutral" trendValue="No change" />
          </motion.div>
        )}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Attendance Rate" value={87} icon={TrendingUp} trend="up" trendValue="+2% vs last week" suffix="%" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--popover-foreground)',
                  }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                />
                <Bar dataKey="present" name="Present" fill="var(--primary)" radius={[4, 4, 0, 0]} activeBar={{ fill: 'var(--primary)', fillOpacity: 0.7 }} />
                <Bar dataKey="absent" name="Absent" fill="var(--destructive)" radius={[4, 4, 0, 0]} activeBar={{ fill: 'var(--destructive)', fillOpacity: 0.7 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/admin/students')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Student
          </Button>
          <Button onClick={() => navigate('/admin/lecturers')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Lecturer
          </Button>
          <Button onClick={() => navigate('/admin/courses')} variant="outline" className="gap-2">
            <Plus className="size-4" /> Add Course
          </Button>
          <Button onClick={() => navigate('/admin/departments')} variant="outline" className="gap-2">
            <Building2 className="size-4" /> Manage Departments
          </Button>
          <Button onClick={() => navigate('/admin/semesters')} variant="outline" className="gap-2">
            <CalendarDays className="size-4" /> Manage Semesters
          </Button>
          <Button onClick={() => navigate('/admin/enrollment')} variant="outline" className="gap-2">
            <UserPlus className="size-4" /> Manage Enrollment
          </Button>
          <Button onClick={() => navigate('/admin/audit-logs')} variant="outline" className="gap-2">
            <ScrollText className="size-4" /> View Audit Logs
          </Button>
          <Button onClick={() => navigate('/admin/reports')} variant="outline" className="gap-2">
            <TrendingUp className="size-4" /> View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
