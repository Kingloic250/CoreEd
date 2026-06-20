import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Bell, ChevronDown, ChevronUp, Info, AlertTriangle, Megaphone, Plus, Send, Users, GraduationCap, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useGetAnnouncements, useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { markAllAnnouncementsRead } from '@/utils/notificationRead';

const priorityConfig: Record<string, { icon: typeof Megaphone; label: string; color: string }> = {
  high: { icon: AlertTriangle, label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  normal: { icon: Info, label: 'Normal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

const targetLabels: Record<string, string> = {
  student: 'Students',
  lecturer: 'Lecturers',
  admin: 'Admin',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'normal'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRoles: ['admin', 'student', 'lecturer'], priority: 'normal' });

  const { data: announcements, isLoading } = useGetAnnouncements(user?.role);
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Record<string, unknown> | null>(null);
  const list = (announcements as Record<string, unknown>[]) ?? [];

  useEffect(() => {
    if (list.length > 0) markAllAnnouncementsRead(list.map((a) => String(a.id)));
  }, [list.length]);

  const filtered = list.filter((a) => {
    const matchSearch =
      String(a.title).toLowerCase().includes(search.toLowerCase()) ||
      String(a.body ?? a.message ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.priority === filter;
    return matchSearch && matchFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleTarget = (role: string) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const openCreate = () => {
    setEditingAnnouncement(null);
    setForm({ title: '', body: '', targetRoles: ['admin', 'student', 'lecturer'], priority: 'normal' });
    setCreateOpen(true);
  };

  const openEdit = (announcement: Record<string, unknown>) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: String(announcement.title ?? ''),
      body: String(announcement.body ?? announcement.message ?? ''),
      targetRoles: (announcement.targetRoles as string[]) ?? ['student', 'lecturer'],
      priority: String(announcement.priority ?? 'normal'),
    });
    setCreateOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.body || form.targetRoles.length === 0) return;
    if (editingAnnouncement) {
      await updateMutation.mutateAsync({
        id: String(editingAnnouncement.id),
        title: form.title,
        body: form.body,
        targetRoles: form.targetRoles,
        priority: form.priority,
      });
    } else {
      await createMutation.mutateAsync({
        title: form.title,
        body: form.body,
        targetRoles: form.targetRoles,
        priority: form.priority,
        createdBy: user?.id,
      });
    }
    setCreateOpen(false);
    setEditingAnnouncement(null);
    setForm({ title: '', body: '', targetRoles: ['admin', 'student', 'lecturer'], priority: 'normal' });
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay updated with university announcements and alerts"
        actionLabel={user?.role === 'admin' ? 'Create' : undefined}
        actionIcon={Plus}
        onAction={user?.role === 'admin' ? openCreate : undefined}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Bell className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'high', 'normal'] as const).map((p) => (
            <Button
              key={p}
              variant={filter === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(p)}
              className="capitalize"
            >
              {p === 'high' && <AlertTriangle className="size-3 mr-1" />}
              {p === 'normal' && <Info className="size-3 mr-1" />}
              {p}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = priorityConfig[String(n.priority)] ?? priorityConfig.normal;
            const { icon: Icon, label, color } = config;
            const isExpanded = expandedId === n.id;
            const body = String(n.body ?? n.message ?? '');
            const truncated = body.length > 120;
            const targets = (n.targetRoles as string[]) ?? [];

            return (
              <Card
                key={String(n.id)}
                className={`transition-shadow hover:shadow-md cursor-pointer ${n.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}`}
                onClick={() => toggleExpand(String(n.id))}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 mt-0.5 ${String(n.priority) === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      <Icon className={`size-4 ${String(n.priority) === 'high' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{String(n.title)}</h3>
                        <Badge variant="outline" className={`text-[10px] ${color}`}>{label}</Badge>
                        {targets.map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[10px] gap-1">
                            {t === 'student' ? <GraduationCap className="size-3" /> : <Users className="size-3" />}
                            {targetLabels[t] ?? t}
                          </Badge>
                        ))}
                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(n);
                            }}
                            className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className={`text-sm text-muted-foreground ${!isExpanded && truncated ? 'line-clamp-2' : ''}`}>
                          {body}
                        </p>
                        {truncated && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(String(n.id));
                            }}
                            className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="size-3" /></>
                            ) : (
                              <>Read more <ChevronDown className="size-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(String(n.createdAt)), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setEditingAnnouncement(null); setCreateOpen(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="announceTitle">Title</Label>
              <Input
                id="announceTitle"
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announceBody">Message</Label>
              <Textarea
                id="announceBody"
                placeholder="Write your announcement..."
                className="min-h-[100px]"
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Target audience</Label>
              <div className="flex gap-2">
                {['admin', 'student', 'lecturer'].map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={form.targetRoles.includes(role) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTarget(role)}
                    className="gap-1"
                  >
                    {role === 'student' ? <GraduationCap className="size-3" /> : role === 'lecturer' ? <Users className="size-3" /> : <Bell className="size-3" />}
                    {role === 'student' ? 'Students' : role === 'lecturer' ? 'Lecturers' : 'Admin'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {['normal', 'high'].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={form.priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                    className="capitalize gap-1"
                  >
                    {p === 'high' && <AlertTriangle className="size-3" />}
                    {p === 'normal' && <Info className="size-3" />}
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingAnnouncement(null); setCreateOpen(false); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.body || form.targetRoles.length === 0 || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (
                <><Send className="size-3 mr-1" /> {editingAnnouncement ? 'Update' : 'Post'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
