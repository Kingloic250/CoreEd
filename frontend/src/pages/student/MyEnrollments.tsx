import { useState } from 'react';
import {
  BookOpen, Calendar, Clock, User, MapPin, AlertTriangle, CheckCircle2,
  XCircle, GraduationCap, ArrowRight, Loader2, Ban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useMyEnrollments, useCreditUsage, useMyWaitlist, useDropCourse } from '@/hooks/useEnroll';
import { formatDate } from '@/utils/formatters';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  REGISTERED: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  COMPLETED: { label: 'Completed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  WITHDRAWN: { label: 'Withdrawn', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  WAITLISTED: { label: 'Waitlisted', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
};

export function MyEnrollments() {
  const { user } = useAuth();
  const { data: enrollData, isLoading } = useMyEnrollments(user?.id);
  const { data: creditUsage } = useCreditUsage(user?.id);
  const { data: waitlist } = useMyWaitlist(user?.id);
  const dropMutation = useDropCourse();
  const [droppingId, setDroppingId] = useState<string | null>(null);

  const enrollments = (enrollData?.enrollments ?? []) as Record<string, unknown>[];
  const waitlistEntries = (waitlist ?? []) as Record<string, unknown>[];

  const activeEnrollments = enrollments.filter((e) => e.status === 'REGISTERED');
  const historyEnrollments = enrollments.filter((e) => e.status === 'WITHDRAWN' || e.status === 'COMPLETED');

  const handleDrop = async (enrollment: Record<string, unknown>) => {
    const id = String(enrollment.id);
    setDroppingId(id);
    try {
      await dropMutation.mutateAsync({
        courseId: String(enrollment.courseId),
        studentId: String(enrollment.studentId),
      });
    } catch {
      // error toast handled by hook
    } finally {
      setDroppingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="My Enrollments" description="View and manage your course registrations" />

      {/* Credit Usage */}
      {creditUsage && creditUsage.activeSemester && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {String(creditUsage.activeSemester.name)}
                </span>
              </div>
              <Badge variant={creditUsage.remainingCredits > 0 ? 'secondary' : 'destructive'} className="text-xs">
                {creditUsage.remainingCredits > 0 ? `${creditUsage.remainingCredits} credits remaining` : 'Full'}
              </Badge>
            </div>
            <Progress
              value={(creditUsage.currentCredits / creditUsage.maxCredits) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {creditUsage.currentCredits} / {creditUsage.maxCredits} credits used
            </p>
            {creditUsage.activeSemester.registrationOpenDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Registration: {formatDate(String(creditUsage.activeSemester.registrationOpenDate))}
                {' — '}
                {formatDate(String(creditUsage.activeSemester.registrationCloseDate))}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="gap-1.5">
            <BookOpen className="size-3.5" />
            Active ({activeEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="waitlist" className="gap-1.5">
            <Clock className="size-3.5" />
            Waitlist ({waitlistEntries.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <CheckCircle2 className="size-3.5" />
            History ({historyEnrollments.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Active Tab ── */}
        <TabsContent value="active">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : activeEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <BookOpen className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                No active enrollments.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.map((e) => {
                const course = e.course as Record<string, unknown> | undefined;
                const group = e.group as Record<string, unknown> | undefined;
                const semester = e.semester as Record<string, unknown> | undefined;
                const schedule = (group?.schedule as Record<string, string>[]) ?? [];
                const lecturer = group?.lecturer as Record<string, string> | undefined;
                const room = group?.room as Record<string, string> | undefined;

                const now = new Date();
                const dropDeadline = semester?.dropDeadline ? new Date(String(semester.dropDeadline)) : null;
                const withdrawDeadline = semester?.withdrawDeadline ? new Date(String(semester.withdrawDeadline)) : null;
                let deadlineInfo: { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' } | null = null;
                if (dropDeadline && now < dropDeadline) {
                  deadlineInfo = { label: `Drop by ${formatDate(String(semester.dropDeadline))}`, variant: 'secondary' };
                } else if (withdrawDeadline && now < withdrawDeadline) {
                  deadlineInfo = { label: `Withdraw by ${formatDate(String(semester.withdrawDeadline))}`, variant: 'outline' };
                } else if (withdrawDeadline && now >= withdrawDeadline) {
                  deadlineInfo = { label: 'Withdraw deadline passed', variant: 'destructive' };
                }

                return (
                  <Card key={String(e.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{String(course?.name ?? '')}</h3>
                            <Badge variant="outline" className="text-xs">{String(group?.name ?? '')}</Badge>
                            {semester?.dropDeadline && (
                              <Badge variant={deadlineInfo?.variant ?? 'outline'} className="text-xs">
                                {deadlineInfo?.label ?? ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="size-3" />
                              {String(course?.credits ?? '')} credits
                            </span>
                            {lecturer && (
                              <span className="flex items-center gap-1">
                                <User className="size-3" />
                                {String(lecturer.firstName ?? '')} {String(lecturer.lastName ?? '')}
                              </span>
                            )}
                            {room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                {String(room.name ?? '')}
                              </span>
                            )}
                          </div>
                          {schedule.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {schedule.map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                                  <Calendar className="size-2.5" />
                                  {String(s.day ?? '')} {String(s.startTime ?? '')}–{String(s.endTime ?? '')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={STATUS_BADGE.REGISTERED.className + ' text-xs'}>
                            {STATUS_BADGE.REGISTERED.label}
                          </Badge>
                          {(!withdrawDeadline || now < withdrawDeadline) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleDrop(e)}
                              disabled={droppingId === String(e.id)}
                            >
                              {droppingId === String(e.id) ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : dropDeadline && now < dropDeadline ? (
                                'Drop'
                              ) : (
                                'Withdraw'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Waitlist Tab ── */}
        <TabsContent value="waitlist">
          {waitlistEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <Clock className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                You are not on any waitlists.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {waitlistEntries.map((w) => {
                const wCourse = w.course as Record<string, unknown> | undefined;
                const wGroup = w.group as Record<string, unknown> | undefined;
                return (
                  <Card key={String(w.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-400">#{String(w.position)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{String(wCourse?.name ?? '')}</p>
                          <p className="text-xs text-muted-foreground">
                            {String(wGroup?.name ?? '')} · {String(wCourse?.credits ?? '')} credits
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(String(w.createdAt))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          {historyEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                No enrollment history.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyEnrollments.map((e) => {
                const hCourse = e.course as Record<string, unknown> | undefined;
                const hGroup = e.group as Record<string, unknown> | undefined;
                const cfg = STATUS_BADGE[String(e.status)] ?? STATUS_BADGE.WITHDRAWN;
                return (
                  <Card key={String(e.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold">{String(hCourse?.name ?? '')}</h3>
                            {hGroup && <Badge variant="outline" className="text-xs">{String(hGroup.name ?? '')}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {e.droppedAt ? `Ended ${formatDate(String(e.droptAt ?? e.droppedAt))}` : `Enrolled ${formatDate(String(e.enrolledAt))}`}
                          </p>
                        </div>
                        <Badge className={cfg.className + ' text-xs shrink-0'}>{cfg.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
