import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Save, Pencil, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAssignmentById, useGradeSubmission } from '@/hooks/useAssignments';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetGroups } from '@/hooks/useGroups';
import { formatDate, getInitials } from '@/utils/formatters';

export function AssignmentSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: assignment, isLoading } = useGetAssignmentById(id ?? '');
  const gradeMutation = useGradeSubmission();
  const { data: students } = useGetStudents();
  const { data: courses } = useGetCourses();

  const a = assignment as Record<string, unknown> | undefined;
  const studentsList = (students as Record<string, unknown>[]) ?? [];
  const submissions = (a?.submissions as Record<string, unknown>[]) ?? [];
  const courseId = a?.courseId as string | undefined;
  const { data: courseGroups } = useGetGroups(courseId ? { courseId } : undefined);
  const enrolledIds = useMemo(() => {
    if (!courseGroups) return [];
    const set = new Set<string>();
    for (const g of courseGroups as { enrolledStudentIds: string[] }[]) {
      for (const sid of (g.enrolledStudentIds ?? [])) set.add(sid);
    }
    return [...set];
  }, [courseGroups]);

  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});
  const [regrading, setRegrading] = useState<Record<string, boolean>>({});

  const enrolledStudents = useMemo(
    () => studentsList.filter((s) => enrolledIds.includes(String(s.id))),
    [studentsList, enrolledIds]
  );

  const getSubmission = (studentId: string) => submissions.find((s) => s.studentId === studentId);

  const handleGrade = (studentId: string) => {
    const grade = grades[studentId];
    if (!grade || !grade.score) return;
    gradeMutation.mutate({
      assignmentId: id ?? '',
      studentId,
      data: {
        score: Number(grade.score),
        feedback: grade.feedback ?? '',
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  if (!a) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Assignment not found.</CardContent></Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lecturer/assignments')} className="gap-1 text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to Assignments
        </Button>
      </div>

      <PageHeader title={String(a.title)} description={String(a.courseName)} />

      <div className="text-sm text-muted-foreground flex items-center gap-3 mb-6">
        <span>Due {formatDate(String(a.dueDate))}</span>
        <span>•</span>
        <span>{Number(a.maxScore)} pts</span>
        <span>•</span>
        <span>{enrolledStudents.length} students</span>
        <Badge variant="outline" className="text-xs">
          {submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length} submitted
        </Badge>
      </div>

      <div className="space-y-3">
        {enrolledStudents.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No students enrolled in this course.
            </CardContent>
          </Card>
        ) : (
          enrolledStudents.map((s) => {
            const sub = getSubmission(String(s.id));
            const grade = grades[String(s.id)];
            const isGraded = sub?.status === 'graded';
            const isSubmitted = sub?.status === 'submitted';
            const isOverdue = sub?.status === 'overdue';

            return (
              <Card key={String(s.id)}>
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                    {/* Student info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(`${String(s.firstName)} ${String(s.lastName)}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{String(s.firstName)} {String(s.lastName)}</p>
                        <p className="text-xs text-muted-foreground">{String(s.studentNumber)}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <StatusBadge submission={sub} isOverdue={isOverdue} />
                    </div>

                    {/* File */}
                    <div className="text-sm">
                      {sub?.fileUrl ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-xs text-muted-foreground">{String(sub.fileUrl).split('/').pop()}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-1.5" asChild>
                            <a href={String(sub.fileUrl)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-3" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Grade input */}
                    <div className="flex items-end gap-2">
                      {isGraded && !regrading[String(s.id)] ? (
                        <div className="text-sm w-full flex items-start gap-2">
                          <div className="flex-1">
                            <span className="font-semibold text-emerald-600">{Number(sub?.score)}/{Number(a.maxScore)}</span>
                            {sub?.feedback && <p className="text-xs text-muted-foreground mt-0.5">{String(sub.feedback)}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setRegrading((prev) => ({ ...prev, [String(s.id)]: true }));
                              setGrades((prev) => ({
                                ...prev,
                                [String(s.id)]: {
                                  score: String(Number(sub?.score)),
                                  feedback: String(sub?.feedback ?? ''),
                                },
                              }));
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      ) : isSubmitted || regrading[String(s.id)] ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="sr-only">Score</Label>
                              <Input
                                type="number"
                                placeholder="Score"
                                min={0}
                                max={Number(a.maxScore)}
                                value={grade?.score ?? ''}
                                onChange={(e) =>
                                  setGrades((prev) => ({
                                    ...prev,
                                    [String(s.id)]: {
                                      score: e.target.value,
                                      feedback: prev[String(s.id)]?.feedback ?? '',
                                    },
                                  }))
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">/ {Number(a.maxScore)}</span>
                          </div>
                          <Textarea
                            placeholder="Feedback (optional)"
                            rows={2}
                            value={grade?.feedback ?? ''}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [String(s.id)]: {
                                  score: prev[String(s.id)]?.score ?? '',
                                  feedback: e.target.value,
                                },
                              }))
                            }
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={!grade?.score || gradeMutation.isPending}
                              onClick={() => {
                                handleGrade(String(s.id));
                                setRegrading((prev) => ({ ...prev, [String(s.id)]: false }));
                              }}
                            >
                              <Save className="size-3" />
                              {regrading[String(s.id)] ? 'Update Grade' : 'Save Grade'}
                            </Button>
                            {regrading[String(s.id)] && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setRegrading((prev) => ({ ...prev, [String(s.id)]: false }))
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not submitted</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBadge({ submission, isOverdue }: { submission: Record<string, unknown> | undefined; isOverdue: boolean }) {
  if (!submission) return <Badge variant="outline" className="text-xs">Pending</Badge>;
  if (submission.status === 'graded') return <Badge className="bg-emerald-500 text-xs gap-1"><CheckCircle2 className="size-3" />Graded</Badge>;
  if (submission.status === 'submitted') return <Badge variant="secondary" className="text-xs gap-1"><FileText className="size-3" />Submitted</Badge>;
  if (isOverdue) return <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="size-3" />Overdue</Badge>;
  return <Badge variant="outline" className="text-xs gap-1"><Clock className="size-3" />Pending</Badge>;
}
