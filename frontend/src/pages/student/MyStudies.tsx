import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, FileText, CheckCircle2, Clock, AlertCircle, Upload,
  BookOpen, Download, User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAssignments } from '@/hooks/useAssignments';
import { useGetMaterials } from '@/hooks/useMaterials';
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

type Material = {
  id: string;
  title: string;
  type: 'slide' | 'syllabus' | 'reading';
  courseId: string;
  courseName: string;
  fileName: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
};

const MATERIAL_ICONS: Record<string, typeof FileText> = {
  slide: FileText,
  syllabus: FileText,
  reading: BookOpen,
};

const MATERIAL_STYLES: Record<string, string> = {
  slide: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  syllabus: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  reading: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
};

const MATERIAL_LABELS: Record<string, string> = {
  slide: 'Slides',
  syllabus: 'Syllabus',
  reading: 'Reading',
};

const TYPE_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'slide', label: 'Slides' },
  { key: 'syllabus', label: 'Syllabi' },
  { key: 'reading', label: 'Reading' },
];

function getMySubmission(assignments: Assignment[], studentId: string) {
  return assignments.map((a) => {
    const mySub = (a.submissions ?? []).find((s) => s.studentId === studentId);
    return { ...a, mySubmission: mySub ?? null };
  });
}

function StatusBadge({ status, isOverdue, isGraded }: { status: string; isOverdue: boolean; isGraded: boolean }) {
  if (isGraded) return <Badge className="bg-emerald-500 text-xs">Graded</Badge>;
  if (status === 'submitted') return <Badge variant="secondary" className="text-xs gap-1"><Upload className="size-3" />Submitted</Badge>;
  if (isOverdue) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
  return <Badge variant="outline" className="text-xs gap-1"><Clock className="size-3" />Upcoming</Badge>;
}

export function MyStudies() {
  const { user } = useAuth();
  const { data: courses } = useGetCourses();
  const { data: assignments, isLoading: assignmentsLoading } = useGetAssignments({ studentId: user?.id });
  const { data: materials, isLoading: materialsLoading } = useGetMaterials();

  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const assignmentList = (assignments as Assignment[]) ?? [];
  const materialsList = (materials as Material[]) ?? [];
  const withSubmission = getMySubmission(assignmentList, user?.id ?? '');
  const now = new Date();

  // Assignment filter state
  const [assignTab, setAssignTab] = useState('upcoming');

  // Materials filter state
  const [materialType, setMaterialType] = useState('');
  const [materialCourse, setMaterialCourse] = useState('');

  const upcoming = withSubmission.filter(
    (a) => !a.mySubmission?.submittedAt && new Date(a.dueDate) >= now
  );
  const submitted = withSubmission.filter(
    (a) => a.mySubmission?.submittedAt
  );
  const overdue = withSubmission.filter(
    (a) => !a.mySubmission?.submittedAt && new Date(a.dueDate) < now
  );

  const assignTabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length, icon: Clock },
    { key: 'submitted', label: 'Submitted', count: submitted.length, icon: CheckCircle2 },
    { key: 'overdue', label: 'Overdue', count: overdue.length, icon: AlertCircle },
  ];

  const filteredMaterials = useMemo(() => {
    let result = materialsList;
    if (materialType) result = result.filter((m) => m.type === materialType);
    if (materialCourse) result = result.filter((m) => m.courseId === materialCourse);
    return result;
  }, [materialsList, materialType, materialCourse]);

  const enrolledCourseIds = useMemo(() => {
    const ids = new Set<string>();
    assignmentList.forEach((a) => {
      const sub = (a.submissions ?? []).find((s) => s.studentId === user?.id);
      if (sub) ids.add(a.courseId);
    });
    return ids;
  }, [assignmentList, user?.id]);

  const availableCourses = coursesList.filter((c) => enrolledCourseIds.has(String(c.id)));

  function renderAssignments(tabKey: string, items: (Assignment & { mySubmission: Submission | null })[]) {
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
          <Link to={`/student/studies/assignments/${a.id}`} className="block">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{a.courseName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3" />Due {formatDate(a.dueDate)}</span>
                    <span className="flex items-center gap-1"><FileText className="size-3" />{a.maxScore} pts</span>
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

  return (
    <div>
      <PageHeader title="My Studies" description="Assignments, coursework, and learning materials" />

      <Tabs defaultValue="assignments">
        <TabsList className="mb-6">
          <TabsTrigger value="assignments" className="gap-1.5">
            <FileText className="size-3.5" />Assignments
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-1.5">
            <BookOpen className="size-3.5" />Materials
          </TabsTrigger>
        </TabsList>

        {/* ─── ASSIGNMENTS TAB ──────────────────────────────────────────── */}
        <TabsContent value="assignments">
          <Tabs value={assignTab} onValueChange={setAssignTab}>
            <TabsList className="mb-4">
              {assignTabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                  <t.icon className="size-3.5" />
                  {t.label}
                  {t.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{t.count}</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {assignTabs.map((t) => (
              <TabsContent key={t.key} value={t.key}>
                {assignmentsLoading ? (
                  <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
                ) : withSubmission.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
                    No assignments available for your enrolled courses.
                  </CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {t.key === 'upcoming' && renderAssignments('upcoming', upcoming)}
                    {t.key === 'submitted' && renderAssignments('submitted', submitted)}
                    {t.key === 'overdue' && renderAssignments('overdue', overdue)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* ─── MATERIALS TAB ────────────────────────────────────────────── */}
        <TabsContent value="materials">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  variant={materialType === opt.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMaterialType(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="w-48">
              <Select value={materialCourse} onValueChange={setMaterialCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {availableCourses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {String(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {materialsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
              No study materials available.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredMaterials.map((m) => {
                const Icon = MATERIAL_ICONS[m.type] ?? FileText;
                return (
                  <Card key={m.id} className="flex flex-col">
                    <CardContent className="py-4 flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${MATERIAL_STYLES[m.type] ?? 'bg-muted'}`}>
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${MATERIAL_STYLES[m.type] ?? ''}`}>
                              {MATERIAL_LABELS[m.type] ?? m.type}
                            </span>
                            <Badge variant="outline" className="text-xs">{m.courseName}</Badge>
                          </div>
                          <h3 className="font-semibold text-sm mt-1">{m.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="size-3" />
                            <span>{m.uploadedBy}</span>
                            <span>·</span>
                            <span>{formatDate(m.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="px-4 pb-3">
                      <Button variant="outline" size="sm" className="gap-1 w-full" asChild>
                        <a href={(m as Record<string, unknown>).fileUrl as string ?? '#'} target="_blank" rel="noopener noreferrer">
                          <Download className="size-3" /> Download {m.fileName}
                        </a>
                      </Button>
                    </div>
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
