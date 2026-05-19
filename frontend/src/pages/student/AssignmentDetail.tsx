import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Download, Upload, User, CheckCircle2, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useGetAssignmentById, useSubmitAssignment } from '@/hooks/useAssignments';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

export function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: assignment, isLoading } = useGetAssignmentById(id ?? '');
  const submitMutation = useSubmitAssignment();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const a = assignment as Record<string, unknown> | undefined;
  const submissions = (a?.submissions as Record<string, unknown>[]) ?? [];
  const mySubmission = submissions.find((s) => s.studentId === user?.id);
  const isOverdue = a?.dueDate ? new Date(String(a.dueDate)) < new Date() : false;
  const alreadySubmitted = !!mySubmission?.submittedAt;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!id || !user?.id) return;
    submitMutation.mutate({
      id,
      data: {
        studentId: user.id,
        fileUrl: selectedFile?.name ?? 'submission.pdf',
      },
    });
    setSelectedFile(null);
  };

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')} className="gap-1 text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back to My Studies
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : !a ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Assignment not found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{String(a.courseName)}</p>
                <h1 className="text-xl font-bold">{String(a.title)}</h1>
              </div>
              <Badge variant="outline" className="shrink-0">{Number(a.maxScore)} pts</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(a.description)}</p>
                </CardContent>
              </Card>

              {/* Attachments */}
              {(a.attachments as string[] ?? []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(a.attachments as string[]).map((file) => (
                      <div key={file} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          {file}
                        </span>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a href="#" onClick={(e) => e.preventDefault()}><Download className="size-4" /></a>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Submit area */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  {alreadySubmitted ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <CheckCircle2 className="size-4" />
                        <span>Submitted on {formatDate(String(mySubmission?.submittedAt))}</span>
                      </div>
                      {mySubmission?.fileUrl && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="size-4" />
                          {String(mySubmission.fileUrl)}
                        </div>
                      )}
                      {mySubmission?.status === 'graded' && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-800">Grade</span>
                            <span className="text-lg font-bold text-emerald-700">
                              {Number(mySubmission.score)}/{Number(a.maxScore)}
                            </span>
                          </div>
                          {mySubmission.feedback && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-xs font-medium text-emerald-700 mb-1">Feedback</p>
                                <p className="text-sm text-emerald-700">{String(mySubmission.feedback)}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        {isOverdue ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="size-4" /> Past due date
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-4" /> Due {formatDate(String(a.dueDate))}
                          </span>
                        )}
                      </div>
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.zip"
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="size-8 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {selectedFile ? selectedFile.name : 'Click to upload your assignment'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, TXT or ZIP (max 10MB)
                          </span>
                        </label>
                      </div>
                      <Button
                        className="w-full gap-1"
                        disabled={!selectedFile || submitMutation.isPending}
                        onClick={handleSubmit}
                      >
                        <Upload className="size-4" />
                        {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4 shrink-0" />
                    <span>Due {formatDate(String(a.dueDate))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="size-4 shrink-0" />
                    <span>{Number(a.maxScore)} points max</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-4 shrink-0" />
                    <span>{String(a.createdBy)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-4 shrink-0" />
                    <span>{submissions.length} students enrolled</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Status</span>
                    <StatusBadge status={mySubmission?.status as string ?? 'pending'} isOverdue={isOverdue} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (status === 'graded') return <Badge className="bg-emerald-500">Graded</Badge>;
  if (status === 'submitted') return <Badge variant="secondary" className="gap-1"><Upload className="size-3" />Submitted</Badge>;
  if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
  return <Badge variant="outline">Upcoming</Badge>;
}
