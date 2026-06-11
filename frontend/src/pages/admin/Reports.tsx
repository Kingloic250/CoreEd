import { Download, Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useAttendanceSummary, useGradeDistribution, useReportsOverview } from '@/hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCsv } from '@/utils/csv';

export function Reports() {
  const { data: overview, isLoading: overviewLoading } = useReportsOverview();
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceSummary();
  const { data: gradeData, isLoading: gradeLoading } = useGradeDistribution();

  const attendanceList = (attendanceData ?? []);
  const gradeDistribution = (gradeData ?? []);

  const handleExportCsv = () => {
    const headers = ['Course Name', 'Attendance Rate (%)', 'Present', 'Total'];
    const rows = attendanceList.map((d) => [d.name, String(d.rate), String(d.present), String(d.total)]);
    downloadCsv('attendance-summary.csv', headers, rows);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div>
      <PageHeader title="Reports" description="Academic performance overview" />

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="size-4" /> Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalStudents ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalCourses ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
                  <GraduationCap className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalLecturers ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                  <Building2 className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalDepartments ?? 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary by Course</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : attendanceList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
              ) : (
                <div className="space-y-3">
                  {attendanceList.map((d) => (
                    <div key={d.courseId} className="flex items-center gap-3">
                      <span className="text-sm text-foreground min-w-0 flex-1 truncate">{d.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{d.rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : gradeDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No grades recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
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
                    <Bar dataKey="count" name="Students" fill="var(--primary)" radius={[4, 4, 0, 0]} activeBar={{ fill: 'var(--primary)', fillOpacity: 0.7 }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}