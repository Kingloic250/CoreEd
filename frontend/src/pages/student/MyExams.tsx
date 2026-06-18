import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetExams } from '@/hooks/useExams';
import { useAuth } from '@/hooks/useAuth';
import { useMyEnrollments } from '@/hooks/useEnroll';

export function MyExams() {
  const { user } = useAuth();
  const { data: enrollments } = useMyEnrollments(user?.id);

  const enrolledData = enrollments as { enrollments: { groupId: string }[] } | undefined;
  const enrolledGroupIds = useMemo(() => {
    const set = new Set<string>();
    const list = enrolledData?.enrollments ?? [];
    for (const e of list) set.add(e.groupId);
    return set;
  }, [enrolledData]);

  const { data: exams, isLoading } = useGetExams();

  const myExams = useMemo(() => {
    const list = (exams ?? []) as {
      id: string; title: string; date: string | null; startTime: string | null; endTime: string | null;
      type: string; status: string; maxScore: number; groupId: string | null;
      course: { name: string } | null;
      group: { name: string } | null;
      room: { name: string; code: string | null } | null;
    }[];
    return list.filter((e) => !e.groupId || enrolledGroupIds.has(e.groupId));
  }, [exams, enrolledGroupIds]);

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
