import { useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetCurrentStudent } from '@/hooks/useStudents';
import { useGetActiveSemester } from '@/hooks/useSemesters';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

const courseColors = [
  'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300',
  'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300',
  'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300',
  'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-300',
  'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300',
  'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-950/40 dark:border-cyan-700 dark:text-cyan-300',
  'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950/40 dark:border-orange-700 dark:text-orange-300',
  'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-950/40 dark:border-pink-700 dark:text-pink-300',
  'bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-300',
  'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300',
];

function getCourseColor(courseId: string) {
  const hash = courseId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return courseColors[hash % courseColors.length];
}

export function StudentTimetable() {
  const { data: currentStudent } = useGetCurrentStudent();
  const { activeSemester } = useGetActiveSemester();
  const studentId = currentStudent ? (currentStudent as Record<string, unknown>).id as string : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;

  const { data: courses, isLoading } = useGetCourses(
    studentId && semesterId ? { studentId, semesterId } : undefined
  );

  const entries = useMemo(() => {
    const courseList = (courses as Record<string, unknown>[]) ?? [];
    const result: { courseId: string; courseName: string; color: string; day: string; startTime: string; endTime: string; room: string }[] = [];
    courseList.forEach((c) => {
      const schedule = (c.schedule as Record<string, string>[]) ?? [];
      schedule.forEach((s) => {
        result.push({
          courseId: String(c.id),
          courseName: String(c.name),
          color: getCourseColor(String(c.id)),
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: String(c.room ?? ''),
        });
      });
    });
    return result;
  }, [courses]);

  const entryMap = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const key = `${e.day}|${e.startTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const today = DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1];

  return (
    <div className="space-y-4">
      <PageHeader title="My Timetable" description="Your weekly course schedule" />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No courses scheduled this semester. Enroll in courses to see your timetable.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border bg-muted/30">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border">Time</div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={`p-2 text-xs font-semibold text-center border-r border-border last:border-r-0 ${
                    day === today ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border last:border-b-0">
                <div className="flex items-start justify-center p-1 text-[10px] text-muted-foreground border-r border-border pt-1.5">
                  {hour}
                </div>
                {DAYS.map((day) => {
                  const slotKey = `${day}|${hour}`;
                  const slotEntries = entryMap.get(slotKey) ?? [];
                  const isToday = day === today;

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`relative min-h-[60px] border-r border-border last:border-r-0 p-0.5 ${
                        isToday ? 'bg-primary/[0.02]' : ''
                      }`}
                    >
                      {slotEntries.map((entry) => (
                        <div
                          key={`${entry.courseId}-${entry.startTime}`}
                          className={`rounded border px-1.5 py-0.5 text-[11px] leading-tight mb-0.5 ${entry.color}`}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            <Clock className="size-3 shrink-0" />
                            {entry.courseName}
                          </div>
                          <div className="truncate opacity-75 flex items-center gap-1">
                            <MapPin className="size-2.5 shrink-0" />
                            {entry.room}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}