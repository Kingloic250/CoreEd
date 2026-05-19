import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from '@/hooks/useAssignments';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetCourses } from '@/hooks/useCourses';
import { formatDate } from '@/utils/formatters';

export function ManageAssignments() {
  const { data: lecturer } = useGetCurrentLecturer();
  const lecturerProfile = lecturer as Record<string, unknown> | undefined;
  const assignedCourseIds = (lecturerProfile?.assignedCourses as string[]) ?? [];

  const { data: courses } = useGetCourses();
  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const myCourses = coursesList.filter((c) => assignedCourseIds.includes(String(c.id)));

  const { data: allAssignments, isLoading } = useGetAssignments();
  const myAssignments = ((allAssignments as Record<string, unknown>[]) ?? []).filter(
    (a) => assignedCourseIds.includes(String(a.courseId))
  );

  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMaxScore, setFormMaxScore] = useState('100');

  const coursesForSelect = useMemo(() => {
    if (myCourses.length > 0) return myCourses;
    return allAssignments && (allAssignments as Record<string, unknown>[]).length > 0
      ? coursesList
      : coursesList;
  }, [myCourses, allAssignments, coursesList]);

  const openCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormCourseId(myCourses[0]?.id ? String(myCourses[0].id) : '');
    setFormDueDate('');
    setFormMaxScore('100');
    setDialogOpen(true);
  };

  const openEdit = (a: Record<string, unknown>) => {
    setEditingId(String(a.id));
    setFormTitle(String(a.title));
    setFormDescription(String(a.description));
    setFormCourseId(String(a.courseId));
    setFormDueDate(String(a.dueDate));
    setFormMaxScore(String(a.maxScore));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formCourseId) return;
    const data: Record<string, unknown> = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      courseId: formCourseId,
      dueDate: formDueDate,
      maxScore: Number(formMaxScore),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      const course = coursesList.find((c) => c.id === formCourseId);
      data.courseName = course?.name ?? 'Unknown';
      data.createdBy = lecturerProfile
        ? `${String(lecturerProfile.firstName)} ${String(lecturerProfile.lastName)}`
        : 'Unknown';
      createMutation.mutate(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div>
      <PageHeader title="Manage Assignments" description="Create and manage coursework for your courses" actionLabel="New Assignment" actionIcon={Plus} onAction={openCreate} />

      {myAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No assignments yet. Click "New Assignment" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myAssignments.map((a) => (
            <Card key={String(a.id)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{String(a.title)}</h3>
                      <Badge variant="outline" className="text-xs">{String(a.courseName)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="size-3" /> Due {formatDate(String(a.dueDate))}</span>
                      <span className="flex items-center gap-1"><FileText className="size-3" /> {Number(a.maxScore)} pts</span>
                      <span>{((a.submissions as Record<string, unknown>[]) ?? []).length} submissions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(String(a.id), String(a.title))}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {coursesForSelect.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Assignment title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe the assignment..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input type="number" value={formMaxScore} onChange={(e) => setFormMaxScore(e.target.value)} min={1} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formTitle.trim() || !formCourseId}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
