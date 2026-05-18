import { useState, useMemo } from 'react';
import { Users, BookOpen, ArrowLeft } from 'lucide-react';
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
import type { ColumnDef } from '@tanstack/react-table';

type Course = Record<string, unknown>;
type Student = Record<string, unknown>;

export function ManageEnrollment() {
  const [courseId, setCourseId] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useGetCourses();
  const { data: studentsData } = useGetStudents();
  const { data: lecturers } = useGetLecturers();
  const { data: departments } = useGetDepartments();

  const courses = (coursesData as Course[]) ?? [];
  const students = (studentsData as Student[]) ?? [];
  const lecturersList = (lecturers as Record<string, string>[]) ?? [];
  const departmentsList = ((departments ?? []) as { id: string; name: string }[]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const enrolledStudents = useMemo(() => {
    if (!selectedCourse) return [];
    const ids = new Set((selectedCourse.studentIds as string[]) ?? []);
    return students.filter((s) => ids.has(String(s.id)));
  }, [selectedCourse, students]);

  const getLecturerName = (id: string) => {
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${l.firstName} ${l.lastName}` : id;
  };

  const getDepartmentName = (id: string) => {
    const d = departmentsList.find((d) => d.id === id);
    return d ? d.name : id;
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
    {
      accessorKey: 'credits',
      header: 'Credits',
    },
    {
      accessorKey: 'year',
      header: 'Year',
    },
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
      <PageHeader title="Enrollment Overview" description="View enrolled students and available course listings" />

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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {String(selectedCourse.name)}
                  <Badge variant="outline" className="text-xs font-normal">
                    {getDepartmentName(String(selectedCourse.department))}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {enrolledStudents.length} enrolled
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
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
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="size-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a course to view enrolled students</p>
              <p className="text-sm">Choose a course from the dropdown above to see who is enrolled.</p>
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
