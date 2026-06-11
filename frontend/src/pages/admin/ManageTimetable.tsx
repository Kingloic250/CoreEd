import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetFaculties } from '@/hooks/useFaculties';
import { useGetRooms } from '@/hooks/useRooms';
import { useGetTimetable, useGenerateTimetable, useApplyTimetable, useCreateTimetableEntry, useUpdateTimetableEntry, useDeleteTimetableEntry } from '@/hooks/useTimetable';

type TimetableEntry = {
  id: string; courseId: string; day: number; startTime: string; endTime: string; roomId: string | null;
  course: { id: string; name: string; year: string | null; lecturerId: string | null };
  room: { id: string; name: string } | null;
};

type Course = Record<string, unknown>;

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

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function ManageTimetable() {
  const [facultyFilter, setFacultyFilter] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: faculties } = useGetFaculties();
  const { data: rooms } = useGetRooms();
  const { data: timetableData, isLoading: timetableLoading } = useGetTimetable(facultyFilter ? { facultyId: facultyFilter } : undefined);
  const generateMutation = useGenerateTimetable();
  const applyMutation = useApplyTimetable();
  const createMutation = useCreateTimetableEntry();
  const updateMutation = useUpdateTimetableEntry();
  const deleteMutation = useDeleteTimetableEntry();

  const courses = (coursesData as Course[]) ?? [];
  const lecturersList = (lecturers as Record<string, unknown>[]) ?? [];
  const facultiesList = (faculties ?? []) as { id: string; name: string; department?: { name: string } }[];
  const roomsList = (rooms ?? []);
  const entries = (timetableData ?? []) as TimetableEntry[];

  const getLecturerName = useCallback(
    (id: string) => {
      const l = lecturersList.find((l) => l.id === id);
      return l ? `${String(l.firstName)} ${String(l.lastName)}` : 'Unknown';
    },
    [lecturersList],
  );

  // --- AI Generate Dialog ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm, setAiForm] = useState({
    facultyId: '', semesterId: '', daysOfWeek: [0, 1, 2, 3, 4],
    timeStart: '08:00', timeEnd: '17:00', periodDuration: 60, periodsPerDay: 8,
  });
  const [generatedEntries, setGeneratedEntries] = useState<{ courseId: string; day: number; startTime: string; endTime: string; roomId: string | null }[] | null>(null);

  const toggleDay = (d: number) => {
    setAiForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(d) ? prev.daysOfWeek.filter((x) => x !== d) : [...prev.daysOfWeek, d].sort(),
    }));
  };

  const handleGenerate = async () => {
    if (!aiForm.facultyId) return;
    setGeneratedEntries(null);
    try {
      const result = await generateMutation.mutateAsync(aiForm);
      setGeneratedEntries(result.entries);
    } catch {
      // error toast handled by hook
    }
  };

  const handleApply = async () => {
    if (!generatedEntries) return;
    await applyMutation.mutateAsync(generatedEntries);
    setAiOpen(false);
    setGeneratedEntries(null);
  };

  // --- Manual Entry Editor ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    id?: string; courseId: string; day: number; startTime: string; endTime: string; roomId: string;
  } | null>(null);
  const [entryForm, setEntryForm] = useState({ courseId: '', day: 0, startTime: '08:00', endTime: '09:00', roomId: '' });

  const [deleteEntry, setDeleteEntry] = useState<string | null>(null);

  const openAdd = (day?: number, time?: string) => {
    setEditingEntry(null);
    setEntryForm({
      courseId: courses.length > 0 ? String(courses[0].id) : '',
      day: day ?? 0,
      startTime: time ?? '08:00',
      endTime: time ? `${String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00` : '09:00',
      roomId: '',
    });
    setEditOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingEntry({
      id: entry.id, courseId: entry.courseId, day: entry.day,
      startTime: entry.startTime, endTime: entry.endTime, roomId: entry.roomId ?? '',
    });
    setEntryForm({
      courseId: entry.courseId, day: entry.day,
      startTime: entry.startTime, endTime: entry.endTime, roomId: entry.roomId ?? '',
    });
    setEditOpen(true);
  };

  const handleSaveEntry = async () => {
    if (editingEntry?.id) {
      await updateMutation.mutateAsync({ id: editingEntry.id, payload: entryForm });
    } else {
      await createMutation.mutateAsync(entryForm);
    }
    setEditOpen(false);
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return;
    await deleteMutation.mutateAsync(deleteEntry);
    setDeleteEntry(null);
  };

  // Group entries by (day, hour) for grid
  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    for (const e of entries) {
      const key = `${e.day}|${e.startTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  // Group generated entries by day for preview
  const generatedGrouped = useMemo(() => {
    if (!generatedEntries) return null;
    const groups: Record<number, typeof generatedEntries> = {};
    for (const e of generatedEntries) {
      if (!groups[e.day]) groups[e.day] = [];
      groups[e.day].push(e);
    }
    return groups;
  }, [generatedEntries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly course schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => setAiOpen(true)}>
            <Sparkles className="size-3.5 mr-1.5" /> AI Generate
          </Button>
          <Button variant="outline" onClick={() => openAdd()}>
            <Plus className="size-3.5 mr-1.5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Faculty Filter */}
      <div className="max-w-xs">
        <Select value={facultyFilter} onValueChange={setFacultyFilter}>
          <SelectTrigger aria-label="Filter by faculty">
            <SelectValue placeholder="All Faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Faculties</SelectItem>
            {facultiesList.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.department ? `${f.department.name} → ${f.name}` : f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timetable Grid */}
      {timetableLoading ? (
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
              {HOURS.map((hour, hi) => (
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
                        className="relative min-h-[60px] border-r border-border last:border-r-0 p-0.5 cursor-pointer hover:bg-muted/20 group"
                        onClick={() => openAdd(di, hour)}
                      >
                        {slotEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`rounded border px-1.5 py-0.5 text-[11px] leading-tight mb-0.5 cursor-pointer ${getCourseColor(entry.courseId)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(entry);
                            }}
                          >
                            <div className="font-medium truncate">{entry.course.name}</div>
                            <div className="truncate opacity-75">{entry.room?.name ?? 'No room'}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Dialog */}
      <Dialog open={aiOpen} onOpenChange={(v) => { setAiOpen(v); if (!v) setGeneratedEntries(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Timetable Generator</DialogTitle>
            <DialogDescription>Configure parameters and let AI generate the schedule.</DialogDescription>
          </DialogHeader>

          {!generatedEntries ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Faculty *</Label>
                  <Select value={aiForm.facultyId} onValueChange={(v) => setAiForm({ ...aiForm, facultyId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                    <SelectContent>
                      {facultiesList.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.department ? `${f.department.name} → ${f.name}` : f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Periods per day</Label>
                  <Input type="number" min={1} max={12} value={aiForm.periodsPerDay}
                    onChange={(e) => setAiForm({ ...aiForm, periodsPerDay: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start time</Label>
                  <Input type="time" value={aiForm.timeStart} onChange={(e) => setAiForm({ ...aiForm, timeStart: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End time</Label>
                  <Input type="time" value={aiForm.timeEnd} onChange={(e) => setAiForm({ ...aiForm, timeEnd: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Period duration (minutes)</Label>
                <Select value={String(aiForm.periodDuration)} onValueChange={(v) => setAiForm({ ...aiForm, periodDuration: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Days of week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((name, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant={aiForm.daysOfWeek.includes(i) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(i)}
                    >
                      {name.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!aiForm.facultyId || aiForm.daysOfWeek.length === 0 || generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="size-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Sparkles className="size-4 mr-2" /> Generate Schedule</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  AI generated <strong>{generatedEntries.length}</strong> entries for {aiForm.daysOfWeek.length} days.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setGeneratedEntries(null)} size="sm">
                    Regenerate
                  </Button>
                  <Button onClick={handleApply} disabled={applyMutation.isPending} size="sm">
                    {applyMutation.isPending ? 'Applying...' : 'Apply Schedule'}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {DAYS.map((dayName, di) => {
                  const dayEntries = generatedEntries.filter((e) => e.day === di);
                  if (dayEntries.length === 0) return null;
                  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
                  return (
                    <div key={di} className="p-3">
                      <h4 className="text-sm font-semibold mb-2">{dayName}</h4>
                      <div className="space-y-1">
                        {dayEntries.map((e, i) => {
                          const course = courseMap[e.courseId] as Course | undefined;
                          const room = roomsList.find((r) => r.id === e.roomId);
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="size-3 shrink-0" />
                              <span className="font-mono">{e.startTime}-{e.endTime}</span>
                              <span className="font-medium text-foreground">{course?.name ?? e.courseId}</span>
                              {room && <Badge variant="outline" className="text-[10px]">{room.name}</Badge>}
                              {!e.roomId && <Badge variant="secondary" className="text-[10px]">No room</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Add/Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}</DialogTitle>
            {editingEntry && <DialogDescription>Update the schedule for this course slot.</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={entryForm.courseId} onValueChange={(v) => setEntryForm({ ...entryForm, courseId: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select value={String(entryForm.day)} onValueChange={(v) => setEntryForm({ ...entryForm, day: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="time" value={entryForm.startTime} onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="time" value={entryForm.endTime} onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Select value={entryForm.roomId} onValueChange={(v) => setEntryForm({ ...entryForm, roomId: v })}>
                <SelectTrigger><SelectValue placeholder="No room (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No room</SelectItem>
                  {roomsList.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}{r.code ? ` (${r.code})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingEntry?.id && (
              <Button type="button" variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => { setEditOpen(false); setDeleteEntry(editingEntry.id!); }}>
                <Trash2 className="size-3.5 mr-1" /> Remove
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEntry} disabled={!entryForm.courseId || createMutation.isPending || updateMutation.isPending}>
              {editingEntry ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteEntry}
        onOpenChange={(v) => !v && setDeleteEntry(null)}
        title="Remove Timetable Entry"
        description="Are you sure you want to remove this entry?"
        confirmLabel="Remove"
        onConfirm={handleDeleteEntry}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}