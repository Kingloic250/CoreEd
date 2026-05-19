import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetClaims, useUpdateClaim } from '@/hooks/useClaims';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  rejected: { icon: AlertCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

export function ManageClaims() {
  const { user } = useAuth();
  const { data: lecturer } = useGetCurrentLecturer();
  const { data: allClaims, isLoading } = useGetClaims();
  const { data: students } = useGetStudents();
  const { data: courses } = useGetCourses();
  const updateClaim = useUpdateClaim();

  const lecturerProfile = lecturer as Record<string, unknown> | undefined;
  const assignedCourseIds = (lecturerProfile?.assignedCourses as string[]) ?? [];
  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const studentsList = (students as Record<string, unknown>[]) ?? [];

  const [filterTab, setFilterTab] = useState('pending');
  const [selectedClaim, setSelectedClaim] = useState<Record<string, unknown> | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const claimsList = ((allClaims as Record<string, unknown>[]) ?? []).filter(
    (c) => assignedCourseIds.includes(String(c.courseId))
  );

  const pending = claimsList.filter((c) => c.status === 'pending');
  const resolved = claimsList.filter((c) => c.status !== 'pending');

  const getStudentName = (id: string) => {
    const s = studentsList.find((st) => st.id === id);
    return s ? `${String(s.firstName)} ${String(s.lastName)}` : id;
  };

  const getCourseName = (id: string) => {
    const c = coursesList.find((co) => co.id === id);
    return String(c?.name ?? id);
  };

  function handleResolve(status: 'approved' | 'rejected') {
    if (!selectedClaim) return;
    updateClaim.mutate({
      id: String(selectedClaim.id),
      data: {
        status,
        resolvedBy: user?.name ?? 'Unknown',
        resolutionNote: resolutionNote.trim(),
      },
    });
    setSelectedClaim(null);
    setResolutionNote('');
  }

  return (
    <div>
      <PageHeader title="Grade Claims" description="Review and respond to student grade appeals" />

      <Tabs value={filterTab} onValueChange={setFilterTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="size-3.5" />
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Resolved
            {resolved.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{resolved.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {['pending', 'resolved'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : claimsList.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
                No grade claims for your courses.
              </CardContent></Card>
            ) : (tab === 'pending' ? pending : resolved).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
                No {tab} claims.
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {(tab === 'pending' ? pending : resolved).map((c) => {
                  const cfg = STATUS_CONFIG[String(c.status)] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <Card key={String(c.id)} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => { setSelectedClaim(c); setResolutionNote(''); }}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{String(c.subject)}</h3>
                              <Badge variant="outline" className="text-xs">{getCourseName(String(c.courseId))}</Badge>
                              <Badge className={cfg.className + ' text-xs gap-1'}><Icon className="size-3" />{cfg.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getStudentName(String(c.studentId))} &middot; {String(c.semester)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              &ldquo;{String(c.reason)}&rdquo;
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-right">
                            <div>
                              <p className="text-sm font-semibold">Claimed: {String(c.claimedGrade)}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(String(c.createdAt))}</p>
                            </div>
                            <Button variant="ghost" size="icon-sm"><Eye className="size-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={(open) => { if (!open) { setSelectedClaim(null); setResolutionNote(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Grade Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Student</span>
                    <p className="font-medium">{getStudentName(String(selectedClaim.studentId))}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Course</span>
                    <p className="font-medium">{getCourseName(String(selectedClaim.courseId))}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Subject</span>
                    <p className="font-medium">{String(selectedClaim.subject)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Semester</span>
                    <p className="font-medium">{String(selectedClaim.semester)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Current Grade</span>
                    <p className="font-medium">{String(selectedClaim.claimedGrade)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Submitted</span>
                    <p className="font-medium">{formatDate(String(selectedClaim.createdAt))}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-xs text-muted-foreground">Reason for Claim</span>
                <p className="text-sm mt-1 bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{String(selectedClaim.reason)}</p>
              </div>

              {selectedClaim.resolvedAt && (
                <>
                  <Separator />
                  <div className="text-sm space-y-1">
                    <span className="text-xs text-muted-foreground">Resolution</span>
                    <div className="space-y-1">
                      <p>
                        <Badge className={(STATUS_CONFIG[String(selectedClaim.status)] ?? STATUS_CONFIG.pending).className + ' text-xs'}>
                          {String(selectedClaim.status).toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground ml-2 text-xs">by {String(selectedClaim.resolvedBy)}</span>
                      </p>
                      {selectedClaim.resolutionNote && (
                        <p className="text-sm mt-1 bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{String(selectedClaim.resolutionNote)}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedClaim.status === 'pending' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="resolutionNote">Resolution Note (optional)</Label>
                    <Textarea
                      id="resolutionNote"
                      placeholder="Explain your decision..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => { setSelectedClaim(null); setResolutionNote(''); }}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleResolve('rejected')}
                      disabled={updateClaim.isPending}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleResolve('approved')}
                      disabled={updateClaim.isPending}
                    >
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
