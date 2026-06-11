import { useState, useMemo } from 'react';
import { Users, BookOpen, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { useEnrollStudents } from '@/hooks/useCourses';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

type Course = Record<string, unknown>;
type Student = Record<string, unknown>;

export function ManageEnrollment() {
  const [courseId, setCourseId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useGetCourses();
  const { data: studentsData } = useGetStudents();
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();
  const enrollMutation = useEnrollStudents();

  const courses = (coursesData as Course[]) ?? [];
  const students = (studentsData as Student[]) ?? [];
  const lecturersList = (lecturers as Record<string, string>[]) ?? [];
  const departmentsList = ((departments ?? []) as { id: string; name: string }[]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const enrolledStudentIds = useMemo(() => {
    if (!selectedCourse) return [];
    return (selectedCourse.studentIds as string[]) ?? [];
  }, [selectedCourse]);

  const enrolledStudents = useMemo(() => {
    return students.filter((s) => enrolledStudentIds.includes(String(s.id)));
  }, [students, enrolledStudentIds]);

  const availableStudents = useMemo(() => {
    return students.filter((s) => !enrolledStudentIds.includes(String(s.id)));
  }, [students, enrolledStudentIds]);

  const getLecturerName = (id: string) => {
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${l.firstName} ${l.lastName}` : id;
  };

  const getDepartmentName = (id: string) => {
    const d = departmentsList.find((d) => d.id === id);
    return d ? d.name : id;
  };

  const handleUnenroll = (studentId: string) => {
    if (!selectedCourse) return;
    const updated = enrolledStudentIds.filter((id) => id !== studentId);
    enrollMutation.mutate(
      { id: selectedCourse.id as string, studentIds: updated },
      { onSuccess: () => setEnrollOpen(false) }
    );
  };

  const handleAddStudents = () => {
    if (!selectedCourse || selectedStudentIds.length === 0) return;
    const updated = [...enrolledStudentIds, ...selectedStudentIds];
    enrollMutation.mutate(
      { id: selectedCourse.id as string, studentIds: updated },
      {
        onSuccess: () => { setSelectedStudentIds([]); setEnrollOpen(false); },
      }
    );
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const availableColumns: ColumnDef<Course>[] = [
    { accessorKey: 'name', header: 'Course' },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => getDepartmentName(String(row.original.department)),
    },
    {
      accessorKey: 'lecturerId',
      header: 'Lecturer',
      cell: ({ row }) => getLecturerName(String(row.original.lecturerId)),
    },
    { accessorKey: 'room', header: 'Room' },
    { accessorKey: 'credits', header: 'Credits' },
    { accessorKey: 'year', header: 'Year' },
    {
      accessorKey: 'studentIds',
      header: 'Enrolled',
      cell: ({ row }) => {
        const count = (row.original.studentIds as string[])?.length ?? 0;
        return <Badge variant="secondary">{count} student{count !== 1 ? 's' : ''}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Enrollment Overview" description="Manage student course enrollment" />

      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrolled">
            <Users className="size-4 mr-1.5" /> Enrolled Students
          </TabsTrigger>
          <TabsTrigger value="available">
            <BookOpen className="size-4 mr-1.5" /> Available Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="enroll-course">Course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
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

          {selectedCourse ? (
            <>
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {String(selectedCourse.name)}
                      <Badge variant="outline" className="text-xs font-normal">
                        {getDepartmentName(String(selectedCourse.department))}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {enrolledStudents.length} enrolled
                      </Badge>
                    </CardTitle>
                  </div>
                  <Button size="sm" onClick={() => setEnrollOpen(!enrollOpen)}>
                    <Plus className="size-3.5 mr-1" /> Add Students
                  </Button>
                </CardHeader>

                {enrollOpen && (
                  <CardContent className="border-b pb-4">
                    <div className="space-y-3">
                      <Label>Select students to add</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                        {availableStudents.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">
                            All students are already enrolled.
                          </p>
                        ) : (
                          availableStudents.map((s) => {
                            const sid = String(s.id);
                            const selected = selectedStudentIds.includes(sid);
                            return (
                              <label
                                key={sid}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => handleToggleStudent(sid)}
                                  className="size-4"
                                />
                                <span className="font-medium">{String(s.firstName)} {String(s.lastName)}</span>
                                <span className="text-muted-foreground ml-auto">{String(s.studentNumber ?? '—')}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddStudents}
                          disabled={selectedStudentIds.length === 0 || enrollMutation.isPending}
                        >
                          {enrollMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin mr-1" />
                          ) : (
                            <Plus className="size-3.5 mr-1" />
                          )}
                          Enroll {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEnrollOpen(false); setSelectedStudentIds([]); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}

                <CardContent className="p-0">
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead className="w-24">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                              No students enrolled in this course
                            </TableCell>
                          </TableRow>
                        ) : (
                          enrolledStudents.map((s) => (
                            <TableRow key={String(s.id)}>
                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {String(s.studentNumber ?? '—')}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">
                                {String(s.firstName)} {String(s.lastName)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{String(s.email)}</TableCell>
                              <TableCell>{String(s.year ?? '—')}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive gap-1"
                                  onClick={() => handleUnenroll(String(s.id))}
                                  disabled={enrollMutation.isPending}
                                >
                                  <X className="size-3.5" /> Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="size-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a course to view enrolled students</p>
              <p className="text-sm">Choose a course from the dropdown above to manage enrollment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available">
          <DataTable
            columns={availableColumns}
            data={courses}
            isLoading={coursesLoading}
            searchPlaceholder="Search courses..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}