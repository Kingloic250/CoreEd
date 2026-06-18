import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetExams } from '@/hooks/useExams';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';

const EXAM_TYPES: Record<string, string> = { midterm: 'blue', final: 'red', quiz: 'amber', other: 'gray' };

export function ExamSchedule() {
  const { data: currentLecturer } = useGetCurrentLecturer();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id as string : undefined;
  const { data: exams } = useGetExams(lecturerId ? { lecturerId } : undefined);

  const examList = (exams ?? []) as {
    id: string; title: string; date: string | null; startTime: string | null; endTime: string | null;
    type: string; status: string; maxScore: number;
    course: { name: string } | null; group: { name: string } | null; room: { name: string; code: string | null } | null;
  }[];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof examList>();
    for (const e of examList) {
      const key = e.date ?? 'unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [examList]);

  return (
    <div>
      <PageHeader title="Exam Schedule" description="View your upcoming exams" />
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No exams scheduled.</p>
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
                        <div className="min-w-0 flex-1">
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
