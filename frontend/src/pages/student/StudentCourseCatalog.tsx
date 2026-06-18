import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, X, Loader2, GraduationCap, User, Building2, ChevronRight,
  CheckCircle2, AlertCircle, RotateCcw, Users, Clock, ListOrdered, CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { useGetGroups } from '@/hooks/useGroups';
import { useEnrollStudent, useDropCourse, useJoinWaitlist, useMyEnrollments, useCreditUsage, useMyWaitlist } from '@/hooks/useEnroll';
import { getGradeColor } from '@/utils/formatters';

type Course = Record<string, unknown>;
type Enrollment = Record<string, unknown>;

const TABS = [
  { key: 'available', label: 'Available', icon: BookOpen },
  { key: 'enrolled', label: 'Currently Enrolled', icon: GraduationCap },
  { key: 'waitlist', label: 'Waitlist', icon: ListOrdered },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'failed', label: 'Failed', icon: AlertCircle },
] as const;

const todayStr = () => new Date().toISOString().split('T')[0];

export function StudentCourseCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: grades } = useGetGrades({ studentId: user?.id });
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();
  const { data: myEnrollments, refetch: refetchEnrollments } = useMyEnrollments(user?.id);
  const { data: creditUsage, refetch: refetchCredits } = useCreditUsage(user?.id);
  const { data: myWaitlist, refetch: refetchWaitlist } = useMyWaitlist(user?.id);
  const enrollMutation = useEnrollStudent();
  const dropMutation = useDropCourse();
  const waitlistMutation = useJoinWaitlist();

  const coursesList = (courses as Course[]) ?? [];
  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const lecturersList = (lecturers as Record<string, unknown>[]) ?? [];
  const departmentsList = ((departments ?? []) as { id: string; name: string }[]);
  const enrollments = (myEnrollments?.enrollments ?? []) as Enrollment[];
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId as string));
  const waitlistEntries = (myWaitlist ?? []) as { courseId: string; groupId: string; position: number; course: { name: string; credits: number } | null }[];

  const studentId = user?.id;
  const [tab, setTab] = useState('available');

  const [enrollDialog, setEnrollDialog] = useState<{ courseId: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [confirmDrop, setConfirmDrop] = useState<{ courseId: string; courseName: string } | null>(null);
  const { data: groupsData } = useGetGroups(
    enrollDialog ? { courseId: enrollDialog.courseId } : undefined
  );
  const groups = (groupsData ?? []) as {
    id: string; name: string; capacity: number; enrolledCount: number;
    courseId: string; room: { name: string } | null;
  }[];

  const getLecturerName = (id: string) => {
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${String(l.firstName)} ${String(l.lastName)}` : 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    const d = departmentsList.find((d) => d.id === id);
    return d ? d.name : id;
  };

  const categorized = useMemo(() => {
    const available: Course[] = [];
    const enrolled: Course[] = [];
    const completed: Course[] = [];
    const failed: Course[] = [];

    coursesList.forEach((course) => {
      const isEnrolledIn = enrolledCourseIds.has(course.id as string);
      if (!isEnrolledIn) {
        available.push(course);
        return;
      }

      const courseGrades = allGrades.filter(
        (g) => String(g.courseId) === String(course.id)
      );

      if (courseGrades.length === 0) {
        enrolled.push(course);
      } else {
        const hasF = courseGrades.some((g) => String(g.grade) === 'F');
        if (hasF) {
          failed.push(course);
        } else {
          completed.push(course);
        }
      }
    });

    return { available, enrolled, completed, failed };
  }, [coursesList, allGrades, enrolledCourseIds]);

  const getLatestGrade = (courseId: string) => {
    const courseGrades = allGrades
      .filter((g) => String(g.courseId) === courseId)
      .sort((a, b) => String(b.semester ?? '').localeCompare(String(a.semester ?? '')));
    return courseGrades[0] ?? null;
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find((e) => e.courseId === courseId) as Enrollment | undefined;
  };

  const handleEnroll = () => {
    if (!enrollDialog || !selectedGroupId || !studentId) return;
    enrollMutation.mutate(
      { courseId: enrollDialog.courseId, groupId: selectedGroupId, studentId },
      {
        onSuccess: () => {
          setEnrollDialog(null);
          setSelectedGroupId('');
          refetchEnrollments();
          refetchCredits();
        },
      }
    );
  };

  const handleJoinWaitlist = (courseId: string, groupId: string) => {
    if (!studentId) return;
    waitlistMutation.mutate(
      { courseId, groupId, studentId },
      { onSuccess: () => refetchWaitlist() }
    );
  };

  const handleDrop = () => {
    if (!confirmDrop || !studentId) return;
    dropMutation.mutate(
      { courseId: confirmDrop.courseId, studentId },
      {
        onSuccess: () => {
          setConfirmDrop(null);
          refetchEnrollments();
          refetchCredits();
        },
      }
    );
  };

  const tabCourses = categorized[tab as keyof typeof categorized];

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">Browse, enroll, and track your courses</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent>
              <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">Browse, enroll, and track your courses</p>
      </div>

      {/* Credit usage bar */}
      {creditUsage && creditUsage.activeSemester && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="size-4 text-muted-foreground" />
                <span className="font-medium">Credit Usage</span>
                <span className="text-muted-foreground">
                  {creditUsage.currentCredits} / {creditUsage.maxCredits} credits
                </span>
              </div>
              <Badge variant={creditUsage.remainingCredits > 0 ? 'secondary' : 'destructive'} className="text-xs">
                {creditUsage.remainingCredits > 0 ? `${creditUsage.remainingCredits} remaining` : 'Full'}
              </Badge>
            </div>
            <Progress value={(creditUsage.currentCredits / creditUsage.maxCredits) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <t.icon className="size-3.5" />
              {t.label}
              {(t.key === 'available' && categorized.available.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{categorized.available.length}</Badge>
              )) || (t.key === 'enrolled' && categorized.enrolled.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{categorized.enrolled.length}</Badge>
              )) || (t.key === 'waitlist' && waitlistEntries.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{waitlistEntries.length}</Badge>
              ))}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Available tab */}
        <TabsContent value="available">
          {categorized.available.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="size-10 text-muted-foreground/30" />
                  <p className="text-sm">No available courses to enroll in.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorized.available.map((course) => (
                <Card key={String(course.id)} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle
                        className="text-base hover:text-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                      >
                        {String(course.name)}
                      </CardTitle>
                    </div>
                    <CardDescription className="flex flex-col gap-1 mt-1">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                        {String(course.year)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                        {getDepartmentName(String(course.department))}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground shrink-0" />
                        {getLecturerName(String(course.lecturerId))}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 text-xs text-muted-foreground">
                    {String(course.credits)} credits
                  </CardContent>
                  <CardFooter className="mt-auto pt-0 flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/student/courses/${String(course.id)}`)}>
                      Details <ChevronRight className="size-3" />
                    </Button>
                    <Button size="sm" className="ml-auto gap-1.5" onClick={() => setEnrollDialog({ courseId: String(course.id) })}>
                      <BookOpen className="size-3.5" /> Enroll
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Enrolled tab */}
        <TabsContent value="enrolled">
          {categorized.enrolled.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <GraduationCap className="size-10 text-muted-foreground/30" />
                  <p className="text-sm">You are not currently enrolled in any courses.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorized.enrolled.map((course) => {
                const enrollment = getEnrollment(String(course.id));
                const sem = enrollment?.semester as Record<string, unknown> | undefined;
                const today = todayStr();
                const canDrop = sem?.dropDeadline && today <= String(sem.dropDeadline);
                const canWithdraw = sem?.withdrawDeadline && today > String(sem.dropDeadline) && today <= String(sem.withdrawDeadline);
                const pastDeadline = sem?.withdrawDeadline && today > String(sem.withdrawDeadline);
                const pending = dropMutation.isPending;

                return (
                  <Card key={String(course.id)} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle
                          className="text-base hover:text-primary transition-colors cursor-pointer"
                          onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                        >
                          {String(course.name)}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                          In Progress
                        </Badge>
                      </div>
                      <CardDescription className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                          {String(course.year)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                          {getDepartmentName(String(course.department))}
                        </span>
                        {sem?.dropDeadline && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Clock className="size-3 text-muted-foreground shrink-0" />
                            Drop deadline: {String(sem.dropDeadline)}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 text-xs text-muted-foreground">
                      {String(course.credits)} credits
                    </CardContent>
                    <CardFooter className="mt-auto pt-0 flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/student/courses/${String(course.id)}`)}>
                        Details <ChevronRight className="size-3" />
                      </Button>
                      {pastDeadline ? (
                        <Badge variant="outline" className="ml-auto text-xs">Past deadline</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`ml-auto gap-1.5 ${!canDrop && canWithdraw ? 'text-amber-600 border-amber-300' : ''}`}
                          onClick={() => setConfirmDrop({ courseId: String(course.id), courseName: String(course.name) })}
                          disabled={pending}
                        >
                          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                          {canDrop ? 'Drop' : canWithdraw ? 'Withdraw' : 'Drop'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Waitlist tab */}
        <TabsContent value="waitlist">
          {waitlistEntries.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <ListOrdered className="size-10 text-muted-foreground/30" />
                  <p className="text-sm">You are not on any waitlists.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {waitlistEntries.map((entry, i) => (
                <Card key={i}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.course?.name ?? 'Unknown course'}</p>
                      <p className="text-sm text-muted-foreground">Position {entry.position} on waitlist</p>
                    </div>
                    <Badge variant="secondary">{entry.course?.credits ?? '?'} credits</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed tab */}
        <TabsContent value="completed">
          {categorized.completed.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="size-10 text-muted-foreground/30" />
                  <p className="text-sm">No completed courses yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorized.completed.map((course) => {
                const grade = getLatestGrade(String(course.id));
                const gradeLetter = grade ? String(grade.grade) : null;
                return (
                  <Card key={String(course.id)} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle
                          className="text-base hover:text-primary transition-colors cursor-pointer"
                          onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                        >
                          {String(course.name)}
                        </CardTitle>
                        {gradeLetter && (
                          <Badge variant="outline" className={`shrink-0 ${getGradeColor(gradeLetter)}`}>
                            {gradeLetter}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                          {String(course.year)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 text-xs text-muted-foreground">
                      {String(course.credits)} credits
                      {grade && (
                        <span className="ml-1">· Score: {Number(grade.score)}/{Number(grade.maxScore)}</span>
                      )}
                    </CardContent>
                    <CardFooter className="mt-auto pt-0">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/student/courses/${String(course.id)}`)}>
                        Details <ChevronRight className="size-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Failed tab */}
        <TabsContent value="failed">
          {categorized.failed.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="size-10 text-muted-foreground/30" />
                  <p className="text-sm">No failed courses. Keep up the good work!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorized.failed.map((course) => (
                <Card key={String(course.id)} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle
                        className="text-base hover:text-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/student/courses/${String(course.id)}`)}
                      >
                        {String(course.name)}
                      </CardTitle>
                      <Badge variant="destructive" className="shrink-0">F</Badge>
                    </div>
                    <CardDescription className="flex flex-col gap-1 mt-1">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="size-3.5 text-muted-foreground shrink-0" />
                        {String(course.year)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 text-xs text-muted-foreground">
                    {String(course.credits)} credits
                  </CardContent>
                  <CardFooter className="mt-auto pt-0 flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/student/courses/${String(course.id)}`)}>
                      Details <ChevronRight className="size-3" />
                    </Button>
                    <Button size="sm" className="ml-auto gap-1.5" onClick={() => setEnrollDialog({ courseId: String(course.id) })}>
                      <RotateCcw className="size-3.5" /> Retake
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Group Selection Dialog */}
      <Dialog open={!!enrollDialog} onOpenChange={(v) => { if (!v) { setEnrollDialog(null); setSelectedGroupId(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Group</DialogTitle>
            <DialogDescription>Choose a group to enroll in this course.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No groups available for this course.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => {
                  const full = g.enrolledCount >= g.capacity;
                  return (
                    <label
                      key={g.id}
                      className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedGroupId === g.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      } ${full ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="group"
                        value={g.id}
                        checked={selectedGroupId === g.id}
                        onChange={() => setSelectedGroupId(g.id)}
                        disabled={full}
                        className="size-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{g.name}</span>
                          <Users className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {g.enrolledCount}/{g.capacity}
                          </span>
                          {full && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">Full</Badge>
                          )}
                        </div>
                        {g.room && <p className="text-xs text-muted-foreground">{g.room.name}</p>}
                      </div>
                      {full && enrollDialog && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinWaitlist(enrollDialog.courseId, g.id);
                          }}
                          disabled={waitlistMutation.isPending}
                        >
                          {waitlistMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : 'Waitlist'}
                        </Button>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEnrollDialog(null); setSelectedGroupId(''); }}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={!selectedGroupId || enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drop/Withdraw Confirmation Dialog */}
      <Dialog open={!!confirmDrop} onOpenChange={(v) => { if (!v) setConfirmDrop(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Drop/Withdraw</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop {confirmDrop?.courseName ?? 'this course'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDrop(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDrop} disabled={dropMutation.isPending}>
              {dropMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
