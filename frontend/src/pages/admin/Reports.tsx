import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses } from '@/hooks/useCourses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCsv } from '@/utils/csv';

const gradeDistribution = [
  { range: '90-100', count: 12, fill: 'var(--chart-1)' },
  { range: '75-89', count: 18, fill: 'var(--chart-2)' },
  { range: '60-74', count: 14, fill: 'var(--chart-3)' },
  { range: '50-59', count: 6, fill: 'var(--chart-4)' },
  { range: '0-49', count: 3, fill: 'var(--chart-5)' },
];

export function Reports() {
  const { data: courses } = useGetCourses();
  const courseList = (courses as Record<string, unknown>[]) ?? [];

  const attendanceData = courseList.map((c) => ({
    name: String(c.name),
    rate: Math.floor(75 + Math.random() * 20),
  }));

  const handleExportCsv = () => {
    const headers = ['Course Name', 'Attendance Rate (%)'];
    const rows = attendanceData.map((d) => [d.name, String(d.rate)]);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary by Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-sm text-foreground min-w-0 flex-1 truncate">{d.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${d.rate}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{d.rate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
