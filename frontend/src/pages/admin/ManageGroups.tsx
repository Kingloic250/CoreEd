import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useGetGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useBulkCreateGroups } from '@/hooks/useGroups';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetSemesters } from '@/hooks/useSemesters';
import { useGetRooms } from '@/hooks/useRooms';
import { useGetFaculties } from '@/hooks/useFaculties';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

type GroupConfig = { name: string; period: 'day' | 'night' };

export function ManageGroups() {
  const [courseFilter, setCourseFilter] = useState('all');
  const { data: groups, isLoading } = useGetGroups(courseFilter !== 'all' ? { courseId: courseFilter } : undefined);
  const { data: courses } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: semesters } = useGetSemesters();
  const { data: rooms } = useGetRooms();
  const { data: faculties } = useGetFaculties();
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();
  const deleteMutation = useDeleteGroup();
  const bulkCreateMutation = useBulkCreateGroups();

  const courseList = (courses ?? []) as { id: string; name: string; credits: number; facultyId?: string }[];
  const lecturerList = (lecturers ?? []) as { id: string; firstName: string; lastName: string }[];
  const semesterList = (semesters ?? []) as { id: string; name: string; year: string }[];
  const roomList = (rooms ?? []) as { id: string; name: string; code: string | null }[];
  const facultiesList = (faculties ?? []) as { id: string; name: string; department?: { name: string } }[];
  const groupsList = (groups ?? []) as {
    id: string; name: string; courseId: string; semesterId: string | null; lecturerId: string | null;
    roomId: string | null; capacity: number; schedule: { day: number; startTime: string; endTime: string }[];
    enrolledCount: number;
    course: { id: string; name: string; credits: number };
    lecturer: { id: string; firstName: string; lastName: string } | null;
    room: { id: string; name: string; code: string | null } | null;
    semester: { id: string; name: string; year: string } | null;
  }[];

  // --- Single group dialog ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', courseId: '', semesterId: '', lecturerId: '', roomId: '', capacity: 30,
    schedule: [] as { day: number; startTime: string; endTime: string }[],
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: 0, startTime: '08:00', endTime: '09:00' });

  const { pageData: pagedGroups, PaginationBar } = usePagination(groupsList);

  const addSlot = () => setForm((f) => ({ ...f, schedule: [...f.schedule, { ...newSlot }] }));
  const removeSlot = (idx: number) => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', courseId: '', semesterId: '', lecturerId: '', roomId: '', capacity: 30, schedule: [] });
    setDialogOpen(true);
  };

  const openEdit = (g: typeof groupsList[0]) => {
    setEditingId(g.id);
    setForm({
      name: g.name, courseId: g.courseId, semesterId: g.semesterId ?? '',
      lecturerId: g.lecturerId ?? '', roomId: g.roomId ?? '', capacity: g.capacity,
      schedule: g.schedule ?? [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.courseId) return;
    const payload = {
      ...form,
      semesterId: form.semesterId || undefined,
      lecturerId: form.lecturerId || undefined,
      roomId: form.roomId || undefined,
    };
    if (editingId) await updateMutation.mutateAsync({ id: editingId, payload });
    else await createMutation.mutateAsync(payload);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  // --- Bulk create dialog ---
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEntries, setBulkEntries] = useState<Record<string, { count: number; groups: GroupConfig[] }>>({});

  const openBulk = () => {
    setBulkEntries({});
    const initial: Record<string, { count: number; groups: GroupConfig[] }> = {};
    for (const c of courseList) {
      initial[c.id] = { count: 0, groups: [] };
    }
    setBulkEntries(initial);
    setBulkOpen(true);
  };

  const handleBulkCountChange = (courseId: string, raw: string) => {
    const count = parseInt(raw, 10);
    if (raw !== '' && isNaN(count)) return;
    const actual = Math.max(0, Math.min(isNaN(count) ? 0 : count, 26));
    const groups: GroupConfig[] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (let i = 0; i < actual; i++) {
      groups.push({ name: letters[i], period: 'day' });
    }
    setBulkEntries((prev) => ({ ...prev, [courseId]: { count: actual, groups } }));
  };

  const handleBulkPeriodChange = (courseId: string, idx: number, period: 'day' | 'night') => {
    setBulkEntries((prev) => {
      const entry = prev[courseId];
      const groups = [...entry.groups];
      groups[idx] = { ...groups[idx], period };
      return { ...prev, [courseId]: { ...entry, groups } };
    });
  };

  const handleBulkCreate = async () => {
    const entries = Object.entries(bulkEntries)
      .filter(([, v]) => v.count > 0 && v.groups.length > 0)
      .map(([courseId, v]) => ({ courseId, groups: v.groups }));
    if (entries.length === 0) return;
    await bulkCreateMutation.mutateAsync(entries);
    setBulkOpen(false);
  };

  const hasBulkSelection = Object.values(bulkEntries).some((v) => v.count > 0);

  // Determine which courses to show in bulk dialog (with faculty filter)
  const [bulkFacultyFilter, setBulkFacultyFilter] = useState('all');
  const filteredBulkCourses = useMemo(() => {
    if (bulkFacultyFilter === 'all') return courseList;
    return courseList.filter((c) => c.facultyId === bulkFacultyFilter);
  }, [courseList, bulkFacultyFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Manage course groups and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={openBulk}>
            <Sparkles className="size-3.5 mr-1.5" /> Bulk Create
          </Button>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="size-3.5 mr-1.5" /> New Group
          </Button>
        </div>
      </div>

      {/* Course filter */}
      <div className="max-w-xs">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger aria-label="Filter by course">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courseList.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading groups...</div>
      ) : groupsList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No groups yet.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Course</th>
                <th className="text-left p-3 font-medium">Lecturer</th>
                <th className="text-left p-3 font-medium">Room</th>
                <th className="text-center p-3 font-medium">Capacity</th>
                <th className="text-center p-3 font-medium">Enrolled</th>
                <th className="text-center p-3 font-medium">Period</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedGroups.map((g) => {
                const isDay = g.schedule?.some((s) => s.startTime === '08:00' && s.endTime === '17:00');
                const isNight = g.schedule?.some((s) => s.startTime === '17:00' && s.endTime === '21:00');
                return (
                  <tr key={g.id} className="hover:bg-muted/20">
                    <td className="p-3 font-medium">{g.name}</td>
                    <td className="p-3">{g.course?.name ?? g.courseId}</td>
                    <td className="p-3">{g.lecturer ? `${g.lecturer.firstName} ${g.lecturer.lastName}` : '-'}</td>
                    <td className="p-3">{g.room?.name ?? '-'}</td>
                    <td className="p-3 text-center">{g.capacity}</td>
                    <td className="p-3 text-center">
                      <Badge variant={g.enrolledCount >= g.capacity ? 'destructive' : 'secondary'}>
                        {g.enrolledCount}/{g.capacity}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {isDay && !isNight ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 gap-1">
                          <Sun className="size-3" /> Day
                        </Badge>
                      ) : isNight && !isDay ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/30 dark:text-indigo-400 gap-1">
                          <Moon className="size-3" /> Night
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive"
                          onClick={() => setDeleteId(g.id)} disabled={g.enrolledCount > 0}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PaginationBar />

      {/* Single Group Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Group' : 'Create Group'}</DialogTitle>
            <DialogDescription>Configure group details and weekly schedule.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Group Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Group A" />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courseList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.credits}cr)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lecturer</Label>
                <Select value={form.lecturerId} onValueChange={(v) => setForm({ ...form, lecturerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign lecturer" /></SelectTrigger>
                  <SelectContent>
                    {lecturerList.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.firstName} {l.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {roomList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}{r.code ? ` (${r.code})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={form.semesterId} onValueChange={(v) => setForm({ ...form, semesterId: v })}>
                <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                <SelectContent>
                  {semesterList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Schedule</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setScheduleOpen(!scheduleOpen)}>
                  {scheduleOpen ? 'Close' : 'Add Slot'}
                </Button>
              </div>
              {scheduleOpen && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={String(newSlot.day)} onValueChange={(v) => setNewSlot({ ...newSlot, day: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="time" value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} />
                    <Input type="time" value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} />
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={addSlot}>Add</Button>
                </div>
              )}
              {form.schedule.length > 0 && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {form.schedule.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between p-2 text-xs">
                      <span>{DAYS[slot.day]} {slot.startTime}-{slot.endTime}</span>
                      <Button variant="ghost" size="icon" className="size-5 text-destructive"
                        onClick={() => removeSlot(i)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.courseId || createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkOpen} onOpenChange={(v) => { if (!v) setBulkOpen(false); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Create Groups</DialogTitle>
            <DialogDescription>Select courses, set group counts, and choose day/night per group.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Faculty filter */}
            <div className="max-w-xs">
              <Select value={bulkFacultyFilter} onValueChange={setBulkFacultyFilter}>
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

            {/* Course rows */}
            {filteredBulkCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No courses found for this faculty.</p>
            ) : (
              <div className="space-y-2">
                {filteredBulkCourses.map((c) => {
                  const entry = bulkEntries[c.id];
                  if (!entry) return null;
                  return (
                    <div key={c.id} className="border rounded-md">
                      <div className="flex items-center gap-3 p-3 bg-muted/20">
                        <span className="text-sm font-medium flex-1">{c.name} ({c.credits}cr)</span>
                        <Label className="sr-only">Groups</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Groups:</span>
                          <Input
                            value={entry.count === 0 ? '' : entry.count}
                            onChange={(e) => handleBulkCountChange(c.id, e.target.value)}
                            className="w-16 h-8 text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {entry.count > 0 && (
                        <div className="divide-y border-t">
                          {entry.groups.map((g, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2 text-sm">
                              <span className="w-20 font-medium text-muted-foreground">{c.name} - {g.name}</span>
                              <Select
                                value={g.period}
                                onValueChange={(v: 'day' | 'night') => handleBulkPeriodChange(c.id, idx, v)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="day">
                                    <span className="flex items-center gap-1.5"><Sun className="size-3.5" /> Day</span>
                                  </SelectItem>
                                  <SelectItem value="night">
                                    <span className="flex items-center gap-1.5"><Moon className="size-3.5" /> Night</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Badge variant="outline" className="text-xs ml-auto">
                                Capacity: 30
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkCreate} disabled={!hasBulkSelection || bulkCreateMutation.isPending}>
              {bulkCreateMutation.isPending ? 'Creating...' : `Create Groups`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Group"
        description="Are you sure you want to delete this group?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
