import { BookOpen, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function MyCourses() {
  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;
  const { data: courses, isLoading } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const myCourses = (courses as Record<string, unknown>[]) ?? [];

  return (
    <div>
      <PageHeader title="My Courses" description={`${myCourses.length} courses assigned`} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map((c) => {
            const schedule = (c.schedule as Record<string, string>[]) ?? [];
            return (
              <Card key={String(c.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{String(c.name)}</CardTitle>
                    <Badge variant="secondary">{String(c.year)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span>Room {String(c.room)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-3.5 shrink-0" />
                    <span>{(c.studentIds as string[])?.length ?? 0} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="size-3.5 shrink-0" />
                    <span>{String(c.year)}</span>
                  </div>

                  {schedule.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-medium text-foreground mb-1.5">Schedule</p>
                      <div className="space-y-1">
                        {DAYS.filter((d) => schedule.some((s) => s.day === d)).map((day) => {
                          const slot = schedule.find((s) => s.day === day);
                          return slot ? (
                            <div key={day} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground w-24">{day}</span>
                              <span className="flex items-center gap-1 text-foreground">
                                <Clock className="size-3" />
                                {slot.startTime}–{slot.endTime}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
