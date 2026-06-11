import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/hooks/useCourses';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetFaculties } from '@/hooks/useFaculties';
import { useGetRooms } from '@/hooks/useRooms';
import { CourseForm } from '@/components/forms/CourseForm';
import type { CourseFormData } from '@/utils/validators';

type CourseRecord = Record<string, unknown>;

export function ManageCourses() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetCourses();
  const { data: lecturers } = useGetLecturers();
  const { data: faculties } = useGetFaculties();
  const { data: rooms } = useGetRooms();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const courses = (data as CourseRecord[]) ?? [];
  const lecturersList = (lecturers as CourseRecord[]) ?? [];
  const facultiesList = ((faculties ?? []) as { id: string; name: string; department?: { id: string; name: string } | null }[]);

  const handleSubmit = async (formData: CourseFormData) => {
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setOpen(false);
    setEditing(null);
  };

  const columns: ColumnDef<CourseRecord>[] = [
    { accessorKey: 'name', header: 'Course Name' },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => {
        const dept = (row.original.faculty as { department?: { name: string } } | undefined)?.department?.name ?? String(row.original.department ?? '');
        return dept;
      },
    },
    { accessorKey: 'credits', header: 'Credits' },
    { accessorKey: 'year', header: 'Year' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditing(row.original); setOpen(true); }}>
              <Pencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(String(row.original.id))}
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Courses"
        description={`${courses.length} courses active`}
        actionLabel="Add Course"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />
      <DataTable columns={columns} data={courses} isLoading={isLoading} searchPlaceholder="Search courses..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          </DialogHeader>
          <CourseForm
            defaultValues={editing as (CourseFormData & { id: string }) | undefined}
            lecturers={lecturersList}
            faculties={facultiesList}
            rooms={(rooms ?? [])}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Course"
        description="Are you sure you want to delete this course?"
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
