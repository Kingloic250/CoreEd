import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetMyExams } from '@/hooks/useExams';

export function MyExams() {
  const { data: exams, isLoading } = useGetMyExams();

  const myExams = (exams ?? []) as {
    id: string; title: string; date: string | null; startTime: string | null; endTime: string | null;
    type: string; status: string; maxScore: number; groupId: string | null;
    course: { name: string } | null;
    group: { name: string } | null;
    room: { name: string; code: string | null } | null;
  }[];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof myExams>();
    for (const e of myExams) {
      const key = e.date ?? 'unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [myExams]);

  return (
    <div>
      <PageHeader title="My Exams" description="View your exam schedule and results" />
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : myExams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No exams scheduled for you.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="size-4" />
                {date === 'unscheduled' ? 'Unscheduled' : date}
              </h3>
              <div className="space-y-2">
                {items.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.course?.name}{e.group ? ` — ${e.group.name}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-sm">
                          {(e.startTime || e.endTime) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {e.startTime}{e.endTime ? `–${e.endTime}` : ''}
                            </span>
                          )}
                          {e.room && <span className="text-xs text-muted-foreground">{e.room.name}</span>}
                          <Badge variant="outline" className="text-xs capitalize">{e.type}</Badge>
                          <span className="text-xs text-muted-foreground">Max: {e.maxScore}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
