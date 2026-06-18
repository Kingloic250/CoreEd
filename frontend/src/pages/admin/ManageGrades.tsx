import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, Filter, CheckSquare, XSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useGetAdminGrades, useApproveGrade, useRejectGrade, useApproveAllGrades } from '@/hooks/useGrades';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetGroups } from '@/hooks/useGroups';
import { getLetterGrade, getGradeColor } from '@/utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
  submitted: { label: 'Submitted', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

export function ManageGrades() {
  const [courseFilter, setCourseFilter] = useState('all');
  const [lecturerFilter, setLecturerFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectGrade, setRejectGrade] = useState<{ id: string; studentName: string } | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const { data: courses } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: groups } = useGetGroups(courseFilter !== 'all' ? { courseId: courseFilter } : undefined);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (courseFilter !== 'all') p.courseId = courseFilter;
    if (lecturerFilter !== 'all') p.lecturerId = lecturerFilter;
    if (groupFilter !== 'all') p.groupId = groupFilter;
    if (statusFilter !== 'all') p.status = statusFilter;
    return p;
  }, [courseFilter, lecturerFilter, groupFilter, statusFilter]);

  const { data: gradesData, isLoading } = useGetAdminGrades(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );
  const approveMutation = useApproveGrade();
  const rejectMutation = useRejectGrade();
  const approveAllMutation = useApproveAllGrades();

  const courseList = (courses ?? []) as { id: string; name: string }[];
  const lecturerList = (lecturers ?? []) as { id: string; firstName: string; lastName: string }[];
  const groupsList = (groups ?? []) as { id: string; name: string }[];

  interface GradeWithRelations {
    id: string; studentId: string; courseId: string; groupId: string | null; lecturerId: string | null;
    semester: string | null; score: number; maxScore: number; grade: string | null; status: string;
    submittedAt: string | null; approvedAt: string | null; rejectionNote: string | null;
    student: { id: string; firstName: string; lastName: string; studentNumber: string | null } | null;
    course: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
    lecturer: { id: string; firstName: string; lastName: string } | null;
  }

  const gradesList = (gradesData ?? []) as GradeWithRelations[];
  const { pageData: pagedGrades, PaginationBar, total } = usePagination(gradesList);

  const submittedCount = gradesList.filter((g) => g.status === 'submitted').length;
  const canBulkApprove = statusFilter === 'all' || statusFilter === 'submitted';

  const handleApprove = (grade: GradeWithRelations) => {
    approveMutation.mutate(grade.id);
  };

  const handleReject = () => {
    if (!rejectGrade) return;
    rejectMutation.mutate({ id: rejectGrade.id, rejectionNote: rejectionNote.trim() || undefined });
    setRejectGrade(null);
    setRejectionNote('');
  };

  const handleApproveAll = () => {
    const ids = gradesList.filter((g) => g.status === 'submitted').map((g) => g.id);
    if (ids.length === 0) return;
    approveAllMutation.mutate({ courseId: courseFilter, groupId: groupFilter !== 'all' ? groupFilter : undefined });
  };

  return (
    <div>
      <PageHeader title="Grade Management" description="Review and approve submitted grades" />

      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[180px]">
          <Label className="text-xs">Course</Label>
          <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setGroupFilter('all'); }}>
            <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseList.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[180px]">
          <Label className="text-xs">Lecturer</Label>
          <Select value={lecturerFilter} onValueChange={setLecturerFilter}>
            <SelectTrigger aria-label="Filter by lecturer"><SelectValue placeholder="All lecturers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lecturers</SelectItem>
              {lecturerList.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.firstName} {l.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs">Group</Label>
          <Select value={groupFilter} onValueChange={setGroupFilter} disabled={!courseFilter || courseFilter === 'all'}>
            <SelectTrigger aria-label="Filter by group"><SelectValue placeholder="All groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groupsList.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[140px]">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {submittedCount > 0 && canBulkApprove && (
          <div className="flex items-center gap-2 pb-0.5">
            <Button
              variant="default"
              size="sm"
              onClick={handleApproveAll}
              disabled={approveAllMutation.isPending}
            >
              <CheckSquare className="size-4 mr-1" />
              Approve All ({submittedCount})
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : pagedGrades.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">No grades found.</div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="py-2.5 px-3 font-medium">Student</th>
                  <th className="py-2.5 px-3 font-medium">Course</th>
                  <th className="py-2.5 px-3 font-medium">Group</th>
                  <th className="py-2.5 px-3 font-medium">Lecturer</th>
                  <th className="py-2.5 px-3 font-medium">Score</th>
                  <th className="py-2.5 px-3 font-medium">Grade</th>
                  <th className="py-2.5 px-3 font-medium">Semester</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedGrades.map((g) => {
                  const cfg = STATUS_CONFIG[g.status] ?? STATUS_CONFIG.draft;
                  const gradeLetter = g.grade ?? getLetterGrade(g.score);
                  const color = getGradeColor(gradeLetter);
                  return (
                    <tr key={g.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-medium">
                          {g.student ? `${g.student.firstName} ${g.student.lastName}` : g.studentId}
                        </span>
                        {g.student?.studentNumber && (
                          <span className="text-xs text-muted-foreground ml-2 font-mono">{g.student.studentNumber}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{g.course?.name ?? g.courseId}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{g.group?.name ?? '-'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">
                        {g.lecturer ? `${g.lecturer.firstName} ${g.lecturer.lastName}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{g.score.toFixed(1)}/{g.maxScore}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={`w-10 justify-center ${color}`}>{gradeLetter}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{g.semester ?? '-'}</td>
                      <td className="py-2.5 px-3">
                        <Badge className={cfg.className + ' text-xs'}>{cfg.label}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {g.status === 'submitted' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleApprove(g)}
                                disabled={approveMutation.isPending}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                title="Approve"
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setRejectGrade({ id: g.id, studentName: g.student ? `${g.student.firstName} ${g.student.lastName}` : g.studentId })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Reject"
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </>
                          )}
                          {g.status === 'rejected' && g.rejectionNote && (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={g.rejectionNote}>
                              {g.rejectionNote}
                            </span>
                          )}
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

      <Dialog open={!!rejectGrade} onOpenChange={(o) => { if (!o) { setRejectGrade(null); setRejectionNote(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reject grade for <strong>{rejectGrade?.studentName}</strong>?
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rejectionNote">Reason (optional)</Label>
              <Textarea
                id="rejectionNote"
                placeholder="Why is this grade being rejected?"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectGrade(null); setRejectionNote(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
