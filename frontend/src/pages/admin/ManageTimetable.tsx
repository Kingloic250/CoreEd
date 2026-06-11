import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetCourses, useUpdateCourse } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';

type Course = Record<string, unknown>;
type ScheduleEntry = { day: string; startTime: string; endTime: string };

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

function getCourseColor(courseId: string, index: number) {
  const hash = courseId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return courseColors[hash % courseColors.length];
}

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function ManageTimetable() {
  const { data: coursesData, isLoading } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const updateMutation = useUpdateCourse();

  const courses = (coursesData as Course[]) ?? [];
  const lecturersList = (lecturers as Record<string, unknown>[]) ?? [];

  const getLecturerName = useCallback(
    (id: string) => {
      const l = lecturersList.find((l) => l.id === id);
      return l ? `${String(l.firstName)} ${String(l.lastName)}` : 'Unknown';
    },
    [lecturersList],
  );

  // Flatten all schedule entries with course info
  const entries = useMemo(() => {
    const result: { courseId: string; courseName: string; color: string; day: string; startTime: string; endTime: string; room: string; lecturer: string }[] = [];
    courses.forEach((c, i) => {
      const schedule = (c.schedule as ScheduleEntry[]) ?? [];
      schedule.forEach((s) => {
        result.push({
          courseId: String(c.id),
          courseName: String(c.name),
          color: getCourseColor(String(c.id), i),
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: String(c.room ?? ''),
          lecturer: getLecturerName(String(c.lecturerId)),
        });
      });
    });
    return result;
  }, [courses, getLecturerName]);

  // Schedule entry editor state
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    courseId: string; day: string; startTime: string; endTime: string;
  } | null>(null);
  const [entryForm, setEntryForm] = useState({ courseId: '', day: 'Monday', startTime: '08:00', endTime: '09:00' });

  const [deleteEntry, setDeleteEntry] = useState<{ courseId: string; day: string; startTime: string } | null>(null);

  const openAdd = (day?: string, time?: string) => {
    setEditingEntry(null);
    setEntryForm({
      courseId: courses.length > 0 ? String(courses[0].id) : '',
      day: day ?? 'Monday',
      startTime: time ?? '08:00',
      endTime: time ? `${String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00` : '09:00',
    });
    setEditOpen(true);
  };

  const openEdit = (entry: { courseId: string; day: string; startTime: string; endTime: string }) => {
    setEditingEntry(entry);
    setEntryForm({ courseId: entry.courseId, day: entry.day, startTime: entry.startTime, endTime: entry.endTime });
    setEditOpen(true);
  };

  const handleSaveEntry = async () => {
    const course = courses.find((c) => c.id === entryForm.courseId);
    if (!course) return;

    const schedule = [...((course.schedule as ScheduleEntry[]) ?? [])];

    if (editingEntry) {
      // Replace existing entry
      const idx = schedule.findIndex(
        (s) => s.day === editingEntry.day && s.startTime === editingEntry.startTime,
      );
      if (idx !== -1) {
        schedule[idx] = { day: entryForm.day, startTime: entryForm.startTime, endTime: entryForm.endTime };
      }
    } else {
      schedule.push({ day: entryForm.day, startTime: entryForm.startTime, endTime: entryForm.endTime });
    }

    await updateMutation.mutateAsync({ id: entryForm.courseId, payload: { schedule } });
    setEditOpen(false);
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return;
    const course = courses.find((c) => c.id === deleteEntry.courseId);
    if (!course) return;

    const schedule = ((course.schedule as ScheduleEntry[]) ?? []).filter(
      (s) => !(s.day === deleteEntry.day && s.startTime === deleteEntry.startTime),
    );
    await updateMutation.mutateAsync({ id: deleteEntry.courseId, payload: { schedule } });
    setDeleteEntry(null);
  };

  // Group entries by (day, hour) for quick lookup - handle half-hour overlaps
  const entryMap = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const key = `${e.day}|${e.startTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly course schedule</p>
        </div>
        <Button onClick={() => openAdd()}>
          <Plus className="size-3.5 mr-1.5" /> Add Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading timetable...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border bg-muted/30">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-xs font-semibold text-center border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slot rows */}
            <div className="relative">
              {HOURS.map((hour, hi) => {
                const isLast = hi === HOURS.length - 1;
                return (
                  <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border last:border-b-0">
                    <div className="flex items-start justify-center p-1 text-[10px] text-muted-foreground border-r border-border pt-1.5">
                      {hour}
                    </div>
                    {DAYS.map((day) => {
                      const slotKey = `${day}|${hour}`;
                      const slotEntries = entryMap.get(slotKey) ?? [];
                      const firstHalfEntries = entryMap.get(`${day}|${hour.replace(':00', ':30')}`) ?? [];

                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="relative min-h-[60px] border-r border-border last:border-r-0 p-0.5 cursor-pointer hover:bg-muted/20 group"
                          onClick={() => openAdd(day, hour)}
                        >
                          {slotEntries.map((entry) => (
                            <div
                              key={`${entry.courseId}-${entry.startTime}`}
                              className={`rounded border px-1.5 py-0.5 text-[11px] leading-tight mb-0.5 cursor-pointer ${entry.color}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit({ courseId: entry.courseId, day: entry.day, startTime: entry.startTime, endTime: entry.endTime });
                              }}
                            >
                              <div className="font-medium truncate">{entry.courseName}</div>
                              <div className="truncate opacity-75">{entry.room}</div>
                            </div>
                          ))}
                          {firstHalfEntries.length > 0 && (
                            <div className="text-[9px] text-muted-foreground/60 italic px-1">…{firstHalfEntries.length} more</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}</DialogTitle>
            {editingEntry && (
              <DialogDescription>Update the schedule for this course slot.</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tt-course">Course</Label>
              <Select value={entryForm.courseId} onValueChange={(v) => setEntryForm({ ...entryForm, courseId: v })}>
                <SelectTrigger id="tt-course" aria-label="Select course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {String(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tt-day">Day</Label>
                <Select value={entryForm.day} onValueChange={(v) => setEntryForm({ ...entryForm, day: v })}>
                  <SelectTrigger id="tt-day" aria-label="Select day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tt-start">Start</Label>
                <Input id="tt-start" type="time" value={entryForm.startTime} onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tt-end">End</Label>
                <Input id="tt-end" type="time" value={entryForm.endTime} onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingEntry && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => {
                  setEditOpen(false);
                  setDeleteEntry({ courseId: editingEntry.courseId, day: editingEntry.day, startTime: editingEntry.startTime });
                }}
              >
                <Trash2 className="size-3.5 mr-1" /> Remove
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEntry} disabled={!entryForm.courseId || updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : editingEntry ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation */}
      <ConfirmDialog
        open={!!deleteEntry}
        onOpenChange={(v) => !v && setDeleteEntry(null)}
        title="Remove Schedule Entry"
        description="Are you sure you want to remove this schedule entry?"
        confirmLabel="Remove"
        onConfirm={handleDeleteEntry}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
