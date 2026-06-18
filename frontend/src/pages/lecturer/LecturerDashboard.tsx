import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookOpen, ClipboardList, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester } from '@/hooks/useSemesters';
import { useGetGroups } from '@/hooks/useGroups';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = DAYS[new Date().getDay()];
  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;
  const { data: courses, isLoading: coursesLoading } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );

  const myCourses = (courses as Record<string, unknown>[]) ?? [];
  const { data: allGroups } = useGetGroups();
  const groupsByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of (allGroups ?? []) as { courseId: string; enrolledCount?: number; enrolledStudentIds: string[] }[]) {
      if (!map[g.courseId]) map[g.courseId] = 0;
      map[g.courseId] += g.enrolledCount ?? (g.enrolledStudentIds ?? []).length;
    }
    return map;
  }, [allGroups]);
  const todayCourses = myCourses.filter((c) =>
    (c.schedule as Record<string, string>[])?.some((s) => s.day === today)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-foreground text-background p-6">
        <p className="text-background/60 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-background/60 text-sm mt-1">
          You have {todayCourses.length} {todayCourses.length === 1 ? 'course' : 'courses'} scheduled today.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Today&apos;s Schedule</h2>
        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : todayCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No courses scheduled for today.
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {todayCourses.map((c) => {
              const todaySlot = (c.schedule as Record<string, string>[])?.find((s) => s.day === today);
              return (
                <motion.div key={String(c.id)} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{String(c.name)}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{String(c.room)}</span>
                          <span className="flex items-center gap-1"><Users className="size-3" />{groupsByCourse[String(c.id)] ?? 0} students</span>
                          {todaySlot && <span className="flex items-center gap-1"><Clock className="size-3" />{todaySlot.startTime}–{todaySlot.endTime}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary">{String(c.year)}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => navigate('/lecturer/attendance')}
                    >
                      <ClipboardList className="size-3.5" /> Mark Attendance
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          </motion.div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">All My Courses</h2>
        {coursesLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {myCourses.map((c) => (
              <motion.div key={String(c.id)} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{String(c.name)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1"><Users className="size-3" /> {groupsByCourse[String(c.id)] ?? 0} students</p>
                    <p className="flex items-center gap-1"><MapPin className="size-3" /> Room {String(c.room)}</p>
                    <p className="flex items-center gap-1"><BookOpen className="size-3" /> {String(c.year)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
