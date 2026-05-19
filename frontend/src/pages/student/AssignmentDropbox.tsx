import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, CheckCircle2, Clock, AlertCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAssignments } from '@/hooks/useAssignments';
import { useGetCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

type Submission = {
  studentId: string;
  submittedAt: string | null;
  fileUrl: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
};

type Assignment = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  attachments: string[];
  createdBy: string;
  submissions: Submission[];
};

function getMySubmission(assignments: Assignment[], studentId: string) {
  return assignments.map((a) => {
    const mySub = (a.submissions ?? []).find((s) => s.studentId === studentId);
    return { ...a, mySubmission: mySub ?? null };
  });
}

export function AssignmentDropbox() {
  const { user } = useAuth();
  const { data: courses } = useGetCourses();
  const { data: assignments, isLoading } = useGetAssignments({ studentId: user?.id });

  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const assignmentList = (assignments as Assignment[]) ?? [];
  const withSubmission = getMySubmission(assignmentList, user?.id ?? '');

  const now = new Date();

  const upcoming = withSubmission.filter(
    (a) => !a.mySubmission?.submittedAt && new Date(a.dueDate) >= now
  );
  const submitted = withSubmission.filter(
    (a) => a.mySubmission?.submittedAt
  );
  const overdue = withSubmission.filter(
    (a) => !a.mySubmission?.submittedAt && new Date(a.dueDate) < now
  );

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length, icon: Clock },
    { key: 'submitted', label: 'Submitted', count: submitted.length, icon: CheckCircle2 },
    { key: 'overdue', label: 'Overdue', count: overdue.length, icon: AlertCircle },
  ];

  return (
    <div>
      <PageHeader title="Assignments" description="Manage and submit your coursework" />

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <t.icon className="size-3.5" />
              {t.label}
              {t.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {t.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : withSubmission.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No assignments available for your enrolled courses.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {t.key === 'upcoming' && renderList(upcoming, 'upcoming', user?.id)}
                {t.key === 'submitted' && renderList(submitted, 'submitted', user?.id)}
                {t.key === 'overdue' && renderList(overdue, 'overdue', user?.id)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  function renderList(items: (Assignment & { mySubmission: Submission | null })[], tabKey: string, studentId?: string) {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-2">
              {tabKey === 'upcoming' && <Clock className="size-8 text-muted-foreground/40" />}
              {tabKey === 'submitted' && <CheckCircle2 className="size-8 text-muted-foreground/40" />}
              {tabKey === 'overdue' && <AlertCircle className="size-8 text-muted-foreground/40" />}
              <span>No {tabKey} assignments.</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return items.map((a) => {
      const isOverdue = !a.mySubmission?.submittedAt && new Date(a.dueDate) < now;
      const isGraded = a.mySubmission?.status === 'graded';

      return (
        <Card key={a.id} className="hover:bg-accent/30 transition-colors">
          <Link to={`/student/assignments/${a.id}`} className="block">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{a.courseName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      Due {formatDate(a.dueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="size-3" />
                      {a.maxScore} pts
                    </span>
                    <span>{a.createdBy}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={a.mySubmission?.status ?? 'pending'} isOverdue={isOverdue} isGraded={isGraded} />
                  {a.mySubmission?.score != null && (
                    <span className="text-sm font-bold">{a.mySubmission.score}/{a.maxScore}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      );
    });
  }
}

function StatusBadge({ status, isOverdue, isGraded }: { status: string; isOverdue: boolean; isGraded: boolean }) {
  if (isGraded) return <Badge className="bg-emerald-500 text-xs">Graded</Badge>;
  if (status === 'submitted') return <Badge variant="secondary" className="text-xs gap-1"><Upload className="size-3" />Submitted</Badge>;
  if (isOverdue) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
  return <Badge variant="outline" className="text-xs gap-1"><Clock className="size-3" />Upcoming</Badge>;
}
