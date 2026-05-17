// Student: monthly attendance calendar with color-coded status
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';

type AttendanceRecord = { date: string; status: string };

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-emerald-500 text-white',
  absent: 'bg-destructive text-white',
  late: 'bg-yellow-500 text-white',
  excused: 'bg-blue-500 text-white',
};

const STATUS_LEGEND = [
  { label: 'Present', style: 'bg-emerald-500' },
  { label: 'Absent', style: 'bg-destructive' },
  { label: 'Late', style: 'bg-yellow-500' },
  { label: 'Excused', style: 'bg-blue-500' },
];

export function MyAttendance() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: attendance, isLoading } = useGetAttendance({ studentId: user?.id });

  const records = (attendance as AttendanceRecord[]) ?? [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart); // 0 = Sunday

  const getStatus = (day: Date) => {
    const rec = records.find((r) => {
      try { return isSameDay(new Date(r.date), day); } catch { return false; }
    });
    return rec?.status ?? null;
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const pct = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader title="My Attendance" description="Your attendance record by month" />

      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Days', value: records.length, color: '' },
            { label: 'Present', value: presentCount, color: 'text-emerald-600' },
            { label: 'Absent', value: absentCount, color: 'text-destructive' },
            { label: 'Attendance Rate', value: `${pct}%`, color: pct >= 80 ? 'text-emerald-600' : 'text-destructive' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-3">
                {isLoading ? <Skeleton className="h-7 w-12 mb-1" /> : (
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56" />
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEK_DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for start offset */}
                  {Array.from({ length: startDow }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day) => {
                    const status = getStatus(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={`aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-colors
                          ${status ? STATUS_STYLES[status] : isToday ? 'border-2 border-primary text-primary' : 'text-foreground hover:bg-accent'}
                        `}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                  {STATUS_LEGEND.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`size-3 rounded-sm ${s.style}`} />
                      {s.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records found.</p>
            ) : (
              <div className="space-y-1.5">
                {records.slice(0, 10).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {(() => { try { return format(new Date(r.date), 'EEE, MMM d, yyyy'); } catch { return r.date; } })()}
                    </span>
                    <Badge
                      variant="outline"
                      className={`capitalize ${STATUS_STYLES[r.status] ?? ''}`}
                    >
                      {r.status}
                    </Badge>
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
