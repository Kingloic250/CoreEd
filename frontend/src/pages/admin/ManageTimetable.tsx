import { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetGroups } from '@/hooks/useGroups';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetFaculties } from '@/hooks/useFaculties';
import { useGetRooms } from '@/hooks/useRooms';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
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

export function ManageTimetable() {
  const [facultyFilter, setFacultyFilter] = useState('all');

  const { data: coursesData } = useGetCourses();
  const { data: groupsData, isLoading: groupsLoading } = useGetGroups();
  const { data: faculties } = useGetFaculties();
  const { data: rooms } = useGetRooms();

  const courses = (coursesData ?? []) as Record<string, unknown>[];
  const facultiesList = (faculties ?? []) as { id: string; name: string; department?: { name: string } }[];
  const roomsList = (rooms ?? []) as { id: string; name: string; code: string | null }[];
  const groups = (groupsData ?? []) as {
    id: string; name: string; courseId: string; roomId: string | null;
    schedule: { day: number; startTime: string; endTime: string }[];
    course: { id: string; name: string; credits: number; facultyId?: string };
    room: { id: string; name: string } | null;
  }[];

  const courseMap = useMemo(() => {
    return Object.fromEntries(courses.map((c) => [c.id, c]));
  }, [courses]);

  const roomMap = useMemo(() => {
    return Object.fromEntries(roomsList.map((r) => [r.id, r]));
  }, [roomsList]);

  // Filter groups by faculty
  const filteredGroups = useMemo(() => {
    if (facultyFilter === 'all') return groups;
    return groups.filter((g) => {
      const c = courseMap[g.courseId] as Record<string, unknown> | undefined;
      return c?.facultyId === facultyFilter;
    });
  }, [groups, facultyFilter, courseMap]);

  // Build schedule grid from group schedules
  const entryMap = useMemo(() => {
    const map = new Map<string, typeof groups>();
    for (const g of filteredGroups) {
      for (const slot of (g.schedule ?? [])) {
        const key = `${slot.day}|${slot.startTime}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(g);
      }
    }
    return map;
  }, [filteredGroups]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly group schedule</p>
        </div>
      </div>

      {/* Faculty Filter */}
      <div className="max-w-xs">
        <Select value={facultyFilter} onValueChange={setFacultyFilter}>
          <SelectTrigger aria-label="Filter by faculty">
            <SelectValue placeholder="All Faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Faculties</SelectItem>
            {facultiesList.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.department ? `${f.department.name} → ${f.name}` : f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timetable Grid */}
      {groupsLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading timetable...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-xs font-semibold text-center border-r border-border last:border-r-0">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            <div className="relative">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                  <div className="flex items-start justify-center p-1 text-[10px] text-muted-foreground border-r border-border pt-1.5">
                    {hour}
                  </div>
                  {DAYS.map((_, di) => {
                    const slotKey = `${di}|${hour}`;
                    const slotEntries = entryMap.get(slotKey) ?? [];
                    return (
                      <div
                        key={`${di}-${hour}`}
                        className="relative min-h-[60px] border-r border-border last:border-r-0 p-0.5"
                      >
                        {slotEntries.map((g) => {
                          const slot = g.schedule?.find((s) => s.day === di && s.startTime === hour);
                          const room = g.roomId ? roomMap[g.roomId] : null;
                          return (
                            <div
                              key={g.id}
                              className={`rounded border px-1.5 py-0.5 text-[11px] leading-tight mb-0.5 ${getCourseColor(g.courseId)}`}
                              title={slot ? `${slot.startTime}-${slot.endTime}` : ''}
                            >
                              <div className="font-medium truncate">
                                {g.course?.name ?? g.courseId} ({g.name})
                              </div>
                              <div className="truncate opacity-75">{room?.name ?? g.room?.name ?? 'No room'}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {filteredGroups.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredGroups.length} group(s) with scheduled slots.
        </div>
      )}
    </div>
  );
}
