import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock, Play, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useGetExams, useGetExam, useCreateExam, useUpdateExam, useDeleteExam, useUpdateExamStatus, useApproveExamResult, useRejectExamResult } from '@/hooks/useExams';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetRooms } from '@/hooks/useRooms';
import { useGetGroups } from '@/hooks/useGroups';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  ongoing: { label: 'Ongoing', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
  graded: { label: 'Graded', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
};

const EXAM_TYPES = ['midterm', 'final', 'quiz', 'other'];

export function ManageExams() {
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectResult, setRejectResult] = useState<{ id: string; studentName: string } | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (courseFilter !== 'all') p.courseId = courseFilter;
    if (statusFilter !== 'all') p.status = statusFilter;
    return p;
  }, [courseFilter, statusFilter]);

  const { data: exams, isLoading } = useGetExams(Object.keys(queryParams).length > 0 ? queryParams : undefined);
  const { data: examDetail } = useGetExam(detailsId || undefined);
  const { data: courses } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: rooms } = useGetRooms();
  const { data: groups } = useGetGroups(courseFilter !== 'all' ? { courseId: courseFilter } : undefined);

  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();
  const deleteMutation = useDeleteExam();
  const approveResultMutation = useApproveExamResult();
  const rejectResultMutation = useRejectExamResult();

  const courseList = (courses ?? []) as { id: string; name: string }[];
  const lecturerList = (lecturers ?? []) as { id: string; firstName: string; lastName: string }[];
  const roomList = (rooms ?? []) as { id: string; name: string; code: string | null }[];
  const groupsList = (groups ?? []) as { id: string; name: string }[];

  const examsList = (exams ?? []) as {
    id: string; title: string; courseId: string; groupId: string | null; lecturerId: string | null;
    roomId: string | null; date: string | null; startTime: string | null; endTime: string | null;
    maxScore: number; type: string; status: string; gradingComponent: string | null;
    course: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
    lecturer: { id: string; firstName: string; lastName: string } | null;
    room: { id: string; name: string; code: string | null } | null;
    _count: { results: number };
  }[];

  const { pageData: pagedExams, PaginationBar } = usePagination(examsList);

  const [form, setForm] = useState({
    title: '', courseId: '', groupId: '', lecturerId: '', roomId: '',
    date: '', startTime: '', endTime: '', maxScore: 100, type: 'exam',
    gradingComponent: '',
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', courseId: '', groupId: '', lecturerId: '', roomId: '', date: '', startTime: '', endTime: '', maxScore: 100, type: 'exam', gradingComponent: '' });
    setDialogOpen(true);
  };

  const openEdit = (e: typeof examsList[0]) => {
    setEditingId(e.id);
    setForm({
      title: e.title, courseId: e.courseId, groupId: e.groupId ?? '', lecturerId: e.lecturerId ?? '',
      roomId: e.roomId ?? '', date: e.date ?? '', startTime: e.startTime ?? '', endTime: e.endTime ?? '',
      maxScore: e.maxScore, type: e.type, gradingComponent: e.gradingComponent ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      courseId: form.courseId,
      groupId: form.groupId || undefined,
      lecturerId: form.lecturerId || undefined,
      roomId: form.roomId || null,
      date: form.date || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      maxScore: form.maxScore,
      type: form.type,
      gradingComponent: form.gradingComponent || null,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch { /* errors handled by hooks */ }
  };

  const results = examDetail as {
    id: string; title: string; maxScore: number; status: string; gradingComponent: string | null;
    course: { id: string; name: string; gradingComponents: unknown } | null;
    group: { id: string; name: string; enrolledStudentIds: string[] } | null;
    results: {
      id: string; studentId: string; score: number; status: string; comments: string | null;
      student: { id: string; firstName: string; lastName: string; studentNumber: string | null };
    }[];
  } | undefined;

  const handleApproveResult = (resultId: string) => approveResultMutation.mutate(resultId);

  const handleRejectResult = () => {
    if (!rejectResult) return;
    rejectResultMutation.mutate({ id: rejectResult.id, rejectionNote: rejectionNote.trim() || undefined });
    setRejectResult(null);
    setRejectionNote('');
  };

  const getStudentName = (s: { firstName: string; lastName: string; studentNumber: string | null }) =>
    `${s.firstName} ${s.lastName}${s.studentNumber ? ` (${s.studentNumber})` : ''}`;

  const resultStatusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    submitted: { label: 'Submitted', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  };

  return (
    <div>
      <PageHeader title="Exam Management" description="Create and manage exam schedules" />

      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs">Course</Label>
          <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setDetailsId(null); }}>
            <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseList.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[140px]">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, c]) => (<SelectItem key={k} value={k}>{c.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}><Plus className="size-4 mr-1" />New Exam</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : pagedExams.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">No exams found.</div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="py-2.5 px-3 font-medium">Title</th>
                  <th className="py-2.5 px-3 font-medium">Course</th>
                  <th className="py-2.5 px-3 font-medium">Group</th>
                  <th className="py-2.5 px-3 font-medium">Lecturer</th>
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Time</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Max</th>
                  <th className="py-2.5 px-3 font-medium">Results</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {pagedExams.map((e) => {
                  const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.scheduled;
                  return (
                    <tr key={e.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{e.title}</td>
                      <td className="py-2.5 px-3">{e.course?.name ?? '-'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{e.group?.name ?? 'All'}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {e.lecturer ? `${e.lecturer.firstName} ${e.lecturer.lastName}` : '-'}
                      </td>
                      <td className="py-2.5 px-3">{e.date ?? '-'}</td>
                      <td className="py-2.5 px-3 text-xs">{e.startTime && e.endTime ? `${e.startTime}–${e.endTime}` : '-'}</td>
                      <td className="py-2.5 px-3 capitalize">{e.type}</td>
                      <td className="py-2.5 px-3 font-mono">{e.maxScore}</td>
                      <td className="py-2.5 px-3">{e._count.results}</td>
                      <td className="py-2.5 px-3"><Badge className={cfg.className + ' text-xs'}>{cfg.label}</Badge></td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setDetailsId(e.id)} title="View results">
                            <Play className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)} title="Edit">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(e.id)} title="Delete" className="text-destructive">
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
          <PaginationBar />
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Exam' : 'Create Exam'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v, groupId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courseList.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Group <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={form.groupId} onValueChange={(v) => setForm((f) => ({ ...f, groupId: v }))} disabled={!form.courseId}>
                <SelectTrigger><SelectValue placeholder="All groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All groups</SelectItem>
                  {groupsList.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lecturer</Label>
              <Select value={form.lecturerId} onValueChange={(v) => setForm((f) => ({ ...f, lecturerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lecturer" /></SelectTrigger>
                <SelectContent>
                  {lecturerList.map((l) => (<SelectItem key={l.id} value={l.id}>{l.firstName} {l.lastName}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Select value={form.roomId} onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No room</SelectItem>
                  {roomList.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}{r.code ? ` (${r.code})` : ''}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((t) => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max Score</Label>
              <Input type="number" min={1} value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Grading Component <span className="text-muted-foreground">(optional — links to grade)</span></Label>
              <Input value={form.gradingComponent} onChange={(e) => setForm((f) => ({ ...f, gradingComponent: e.target.value }))} placeholder="e.g. Midterm Exam" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !form.title || !form.courseId}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!detailsId} onOpenChange={(o) => { if (!o) setDetailsId(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{results?.title ?? 'Exam Results'}</DialogTitle></DialogHeader>
          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Course: <strong>{results.course?.name}</strong></span>
                {results.group && <span>Group: <strong>{results.group.name}</strong></span>}
                <span>Max: <strong>{results.maxScore}</strong></span>
                {results.gradingComponent && <span>→ <strong>{results.gradingComponent}</strong></span>}
              </div>

              {results.results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No results entered yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 px-3 font-medium">#</th>
                      <th className="py-2 px-3 font-medium">Student</th>
                      <th className="py-2 px-3 font-medium">Score</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                      <th className="py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r, i) => {
                      const sc = resultStatusConfig[r.status] ?? resultStatusConfig.draft;
                      return (
                        <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/20">
                          <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 px-3 font-medium">{getStudentName(r.student)}</td>
                          <td className="py-2 px-3 font-mono">{r.score}/{results.maxScore}</td>
                          <td className="py-2 px-3"><Badge className={sc.className + ' text-xs'}>{sc.label}</Badge></td>
                          <td className="py-2 px-3">
                            {r.status === 'submitted' && (
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-sm" onClick={() => handleApproveResult(r.id)} className="text-emerald-600" title="Approve">
                                  <CheckCircle2 className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => setRejectResult({ id: r.id, studentName: getStudentName(r.student) })} className="text-red-600" title="Reject">
                                  <XCircle className="size-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectResult} onOpenChange={(o) => { if (!o) { setRejectResult(null); setRejectionNote(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reject Result</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Reject result for <strong>{rejectResult?.studentName}</strong>?</p>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} rows={3} placeholder="Why is this result being rejected?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectResult(null); setRejectionNote(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectResult} disabled={rejectResultMutation.isPending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Delete Exam" description="This will also delete all results. This cannot be undone."
        confirmLabel="Delete" onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }} />
    </div>
  );
}
