import { useState, useMemo } from 'react';
import { BookOpen, FileText, Download, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetMaterials } from '@/hooks/useMaterials';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetAssignments } from '@/hooks/useAssignments';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

type Material = {
  id: string;
  title: string;
  type: 'slide' | 'syllabus' | 'reading';
  courseId: string;
  courseName: string;
  fileName: string;
  fileUrl: string;
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

export function CourseMaterials() {
  const { user } = useAuth();
  const { data: materials, isLoading } = useGetMaterials();
  const { data: courses } = useGetCourses();
  const { data: assignments } = useGetAssignments({ studentId: user?.id });

  const materialsList = (materials as Material[]) ?? [];
  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const assignmentList = (assignments as Record<string, unknown>[]) ?? [];

  const [typeFilter, setTypeFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const enrolledCourseIds = useMemo(() => {
    const ids = new Set<string>();
    assignmentList.forEach((a) => {
      const subs = (a as Record<string, unknown>).submissions as Record<string, unknown>[] | undefined;
      const sub = (subs ?? []).find((s) => s.studentId === user?.id);
      if (sub) ids.add(String(a.courseId));
    });
    return ids;
  }, [assignmentList, user?.id]);

  const enrolledCourses = coursesList.filter((c) => enrolledCourseIds.has(String(c.id)));

  const filtered = useMemo(() => {
    let result = materialsList;
    if (typeFilter) result = result.filter((m) => m.type === typeFilter);
    if (courseFilter && courseFilter !== 'all') result = result.filter((m) => m.courseId === courseFilter);
    return result;
  }, [materialsList, typeFilter, courseFilter]);

  return (
    <div>
      <PageHeader title="Course Materials" description="Slides, syllabi, and reading materials for your courses" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={typeFilter === opt.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="w-48">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {enrolledCourses.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {String(c.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No course materials available for your enrolled courses.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((m) => {
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
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="size-3" /> Download {m.fileName}
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
