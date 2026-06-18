import { useState, useMemo } from 'react';
import { Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetExams, useGetExam, useCreateExamResult, useSubmitExamResults } from '@/hooks/useExams';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
  submitted: { label: 'Submitted', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

export function ExamResults() {
  const [selectedExam, setSelectedExam] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: currentLecturer } = useGetCurrentLecturer();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id as string : undefined;

  const { data: exams } = useGetExams(lecturerId ? { lecturerId } : undefined);
  const { data: examDetail } = useGetExam(selectedExam || undefined);

  const createResult = useCreateExamResult();
  const submitMutation = useSubmitExamResults();

  const examsList = (exams ?? []) as { id: string; title: string; courseId: string; status: string; type: string; date: string | null }[];

  const details = examDetail as {
    id: string; title: string; maxScore: number; status: string; date: string | null; startTime: string | null; endTime: string | null;
    course: { id: string; name: string };
    group: { id: string; name: string; enrolledStudentIds: string[] } | null;
    results: {
      id: string; studentId: string; score: number; status: string;
      student: { id: string; firstName: string; lastName: string; studentNumber: string | null };
    }[];
  } | undefined;

  const enrolledStudentIds = details?.group?.enrolledStudentIds ?? [];
  const allStudents = details?.results.map((r) => r.student) ?? [];

  const studentResults = useMemo(() => {
    if (!details) return [];
    const resultMap = new Map(details.results.map((r) => [r.studentId, r]));
    const studentSet = new Map<string, typeof allStudents[0]>();
    for (const s of allStudents) studentSet.set(s.id, s);
    for (const sid of enrolledStudentIds) {
      if (!studentSet.has(sid)) {
        studentSet.set(sid, { id: sid, firstName: 'Unknown', lastName: '', studentNumber: null });
      }
    }
    return [...studentSet.values()].map((s) => ({
      student: s,
      result: resultMap.get(s.id),
    }));
  }, [details]);

  const hasDraftResults = details?.results.some((r) => r.status === 'draft');

  const handleScoreChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,3}(\.\d{0,1})?$/.test(value) && Number(value) <= (details?.maxScore ?? 100))) {
      setScores((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSave = async () => {
    if (!selectedExam || !details) return;
    const toSave = Object.entries(scores).filter(([, v]) => v !== '');
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      for (const [studentId, score] of toSave) {
        const existing = details.results.find((r) => r.studentId === studentId);
        if (existing && existing.status !== 'draft') continue;
        await createResult.mutateAsync({
          examId: selectedExam,
          payload: { studentId, score: Number(score) },
        });
      }
      setScores({});
    } catch { /* handled by hook */ }
    setSaving(false);
  };

  const handleSubmit = () => {
    if (!selectedExam) return;
    submitMutation.mutate(selectedExam);
  };

  return (
    <div>
      <PageHeader title="Exam Results" description="Enter and submit exam scores" />
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[280px]">
          <Label className="text-xs">Exam</Label>
          <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); setScores({}); }}>
            <SelectTrigger><SelectValue placeholder="Select an exam" /></SelectTrigger>
            <SelectContent>
              {examsList.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title} ({e.date ?? 'no date'})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!selectedExam && (
        <p className="text-sm text-muted-foreground text-center py-12">Select an exam to enter results.</p>
      )}
      {selectedExam && !details && (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      )}
      {details && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{details.title}</span>
              <span className="text-muted-foreground ml-3">{details.course.name}</span>
              {details.group && <span className="text-muted-foreground ml-2">— {details.group.name}</span>}
              <span className="text-muted-foreground ml-3">Max: {details.maxScore}</span>
              {details.date && <span className="text-muted-foreground ml-3">{details.date} {details.startTime ? details.startTime : ''}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving || createResult.isPending || Object.keys(scores).length === 0}>
                {saving || createResult.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                Save Scores
              </Button>
              {hasDraftResults && (
                <Button variant="secondary" onClick={handleSubmit} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? <Spinner className="size-4" /> : <Send className="size-4" />}
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
          {studentResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No students assigned to this exam.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="py-2.5 px-3 font-medium">#</th>
                    <th className="py-2.5 px-3 font-medium">Student</th>
                    <th className="py-2.5 px-3 font-medium">Score</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map((sr, i) => {
                    const existingScore = sr.result ? String(sr.result.score) : '';
                    const inputScore = scores[sr.student.id] ?? existingScore;
                    const studentStatus = sr.result?.status ?? 'draft';
                    const cfg = STATUS_CONFIG[studentStatus] ?? STATUS_CONFIG.draft;
                    const disabled = studentStatus === 'submitted' || studentStatus === 'approved';
                    return (
                      <tr key={sr.student.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium">
                          {sr.student.firstName} {sr.student.lastName}
                          {sr.student.studentNumber && <span className="text-xs text-muted-foreground ml-2 font-mono">{sr.student.studentNumber}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <Input
                            type="number"
                            min={0}
                            max={details.maxScore}
                            value={inputScore}
                            onChange={(e) => handleScoreChange(sr.student.id, e.target.value)}
                            className="w-24 h-8 text-sm text-center"
                            disabled={disabled}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge className={`${cfg.className} text-xs`}>{cfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
