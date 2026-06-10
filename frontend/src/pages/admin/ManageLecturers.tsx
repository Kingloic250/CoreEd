import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LecturerForm } from '@/components/forms/LecturerForm';
import { useGetLecturers, useCreateLecturer, useUpdateLecturer, useDeleteLecturer } from '@/hooks/useLecturers';
import { useGetDepartments } from '@/hooks/useDepartments';
import { formatDate } from '@/utils/formatters';
import type { LecturerFormData } from '@/utils/validators';

type Lecturer = Record<string, unknown>;

export function ManageLecturers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lecturer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetLecturers();
  const { data: deptData } = useGetDepartments();
  const createMutation = useCreateLecturer();
  const updateMutation = useUpdateLecturer();
  const deleteMutation = useDeleteLecturer();

  const lecturers = (data as Lecturer[]) ?? [];
  const departments = ((deptData as { id: string; name: string }[]) ?? []).map((d) => ({ id: d.id, name: d.name }));

  const handleSubmit = async (formData: LecturerFormData) => {
    try {
      if (editing?.id) {
        await updateMutation.mutateAsync({ id: String(editing.id), payload: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setOpen(false);
      setEditing(null);
    } catch {
      // error toast handled by mutation onError
    }
  };

  const columns: ColumnDef<Lecturer>[] = [
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{String(row.original.firstName)} {String(row.original.lastName)}</p>
          <p className="text-xs text-muted-foreground">{String(row.original.email)}</p>
        </div>
      ),
    },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'qualification', header: 'Qualification' },
    {
      accessorKey: 'joinDate',
      header: 'Join Date',
      cell: ({ row }) => formatDate(String(row.original.joinDate)),
    },
    {
      accessorKey: 'assignedCourses',
      header: 'Courses',
      cell: ({ row }) => {
        const courses = row.original.assignedCourses as string[];
        return <span className="text-sm text-muted-foreground">{courses?.length ?? 0} courses</span>;
      },
    },
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
        title="Manage Lecturers"
        description={`${lecturers.length} lecturers on staff`}
        actionLabel="Add Lecturer"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />

      <DataTable columns={columns} data={lecturers} isLoading={isLoading} searchPlaceholder="Search lecturers..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
          </DialogHeader>
          <LecturerForm
            defaultValues={editing as (LecturerFormData & { id: string }) | undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setOpen(false)}
            departments={departments}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Lecturer"
        description="Are you sure you want to remove this lecturer?"
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
