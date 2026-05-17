import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Check, X, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useEnrollStudents } from '@/hooks/useCourses';

type Course = Record<string, unknown>;
type Student = Record<string, unknown>;

export function ManageEnrollment() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useGetCourses();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudents();
  const enrollMutation = useEnrollStudents();

  const courses = (coursesData as Course[]) ?? [];
  const students = (studentsData as Student[]) ?? [];
  const selectedCourse = courses.find((c) => c.id === courseId);

  const enrolledIds = useMemo(() => {
    if (!selectedCourse) return new Set<string>();
    return new Set((selectedCourse.studentIds as string[]) ?? []);
  }, [selectedCourse]);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    setSearch('');
    const course = courses.find((c) => c.id === id);
    if (course) {
      setSelected(new Set((course.studentIds as string[]) ?? []));
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filteredStudents.map((s) => String(s.id))));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const handleSave = async () => {
    if (!courseId) return;
    await enrollMutation.mutateAsync({ id: courseId, studentIds: Array.from(selected) });
  };

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(s.firstName).toLowerCase().includes(q) ||
      String(s.lastName).toLowerCase().includes(q) ||
      String(s.email).toLowerCase().includes(q)
    );
  });

  const addedCount = useMemo(() => {
    return Array.from(selected).filter((id) => !enrolledIds.has(id)).length;
  }, [selected, enrolledIds]);

  const removedCount = useMemo(() => {
    return Array.from(enrolledIds).filter((id) => !selected.has(id)).length;
  }, [selected, enrolledIds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrollment Management</h1>
          <p className="text-sm text-muted-foreground">Bulk enroll or unenroll students in courses</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="enroll-course">Course</Label>
            <Select value={courseId} onValueChange={handleCourseChange}>
              <SelectTrigger id="enroll-course" aria-label="Select course">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {String(c.name)} ({String(c.year)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{selected.size}</strong> enrolled
                {addedCount > 0 && (
                  <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                    <Check className="size-3 mr-0.5" /> +{addedCount}
                  </Badge>
                )}
                {removedCount > 0 && (
                  <Badge variant="outline" className="ml-2 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                    <X className="size-3 mr-0.5" /> -{removedCount}
                  </Badge>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8 h-9 w-56"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              <Button size="sm" onClick={handleSave} disabled={enrollMutation.isPending || (!addedCount && !removedCount)}>
                <Save className="size-3.5 mr-1.5" />
                {enrollMutation.isPending ? 'Saving...' : 'Save Enrollment'}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Enrolled</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const id = String(student.id);
                    const isChecked = selected.has(id);
                    return (
                      <TableRow key={id} className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleStudent(id)}>
                        <TableCell>
                          <Checkbox checked={isChecked} onCheckedChange={() => toggleStudent(id)} aria-label="Toggle enrollment" />
                        </TableCell>
                        <TableCell className="font-medium">{String(student.firstName)} {String(student.lastName)}</TableCell>
                        <TableCell className="text-muted-foreground">{String(student.email)}</TableCell>
                        <TableCell>{String(student.year ?? '—')}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!courseId && !coursesLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="size-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a course to manage enrollment</p>
          <p className="text-sm">Choose a course from the dropdown above to view and edit enrolled students.</p>
        </div>
      )}
    </div>
  );
}
