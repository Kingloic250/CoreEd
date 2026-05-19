import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendar';
import { formatDate } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';

const EVENT_TYPES = [
  { value: 'exam', label: 'Exam', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  { value: 'deadline', label: 'Deadline', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  { value: 'holiday', label: 'Holiday', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  { value: 'event', label: 'Event', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
];

const TYPE_FILTERS = ['', 'exam', 'deadline', 'holiday', 'event'] as const;

export function ManageCalendar() {
  const { data: events, isLoading } = useGetCalendarEvents();
  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const [filter, setFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', type: 'event', date: '',
    time: '', endTime: '', courseName: '',
  });

  const eventList = ((events as Record<string, unknown>[]) ?? []).filter(
    (e) => !filter || e.type === filter
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', description: '', type: 'event', date: '', time: '', endTime: '', courseName: '' });
    setDialogOpen(true);
  };

  const openEdit = (e: Record<string, unknown>) => {
    setEditingId(String(e.id));
    setForm({
      title: String(e.title ?? ''),
      description: String(e.description ?? ''),
      type: String(e.type ?? 'event'),
      date: String(e.date ?? ''),
      time: String(e.time ?? ''),
      endTime: String(e.endTime ?? ''),
      courseName: String(e.courseName ?? ''),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    const data: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      date: form.date,
      time: form.time || null,
      endTime: form.endTime || null,
      courseName: form.courseName || null,
      targetRoles: form.type === 'holiday' ? ['student', 'lecturer', 'admin'] : ['student', 'lecturer'],
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ ...data, createdBy: 'Admin' });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) deleteMutation.mutate(id);
  };

  return (
    <div>
      <PageHeader
        title="Manage Calendar"
        description="Create and manage academic events, exams, deadlines, and holidays"
        actionLabel="New Event"
        actionIcon={Plus}
        onAction={openCreate}
      />

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>All</Button>
        {EVENT_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={filter === t.value ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setFilter(t.value)}
          >
            <span className={`size-2 rounded-full ${t.color.split(' ')[0]}`} />
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : eventList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No events found. Click "New Event" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {eventList.map((e) => {
            const typeDef = EVENT_TYPES.find((t) => t.value === e.type) ?? EVENT_TYPES[3];
            return (
              <Card key={String(e.id)}>
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col items-center shrink-0 w-10">
                      <span className="text-xs font-bold text-muted-foreground">
                        {String(e.date).slice(8, 10)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {new Date(String(e.date)).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeDef.color}`}>
                          {typeDef.label}
                        </span>
                        {e.courseName && (
                          <span className="text-xs text-muted-foreground">{String(e.courseName)}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{String(e.title)}</p>
                      <p className="text-xs text-muted-foreground truncate">{String(e.description)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(String(e.id), String(e.title))}><Trash2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course (optional)</Label>
                <Input value={form.courseName} onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))} placeholder="e.g. Mathematics 101" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Event description" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.date}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
