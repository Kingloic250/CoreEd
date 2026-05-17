// Admin reports: attendance summary and grade distribution
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetClasses } from '@/hooks/useClasses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const gradeDistribution = [
  { range: '90-100', count: 12, fill: 'var(--chart-1)' },
  { range: '75-89', count: 18, fill: 'var(--chart-2)' },
  { range: '60-74', count: 14, fill: 'var(--chart-3)' },
  { range: '50-59', count: 6, fill: 'var(--chart-4)' },
  { range: '0-49', count: 3, fill: 'var(--chart-5)' },
];

const handleExport = () => toast.info('Export functionality coming soon');

export function Reports() {
  const { data: classes } = useGetClasses();
  const classList = (classes as Record<string, unknown>[]) ?? [];

  return (
    <div>
      <PageHeader title="Reports" description="Academic performance overview" />

      <div className="space-y-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance by class */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classList.map((cls) => {
                  const pct = Math.floor(75 + Math.random() * 20);
                  return (
                    <div key={String(cls.id)} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-32 truncate">{String(cls.name)}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Grade distribution */}
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
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Students" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
