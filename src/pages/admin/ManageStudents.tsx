// Admin: manage students with full CRUD, DataTable, and Sheet form
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StudentForm } from '@/components/forms/StudentForm';
import { useGetStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { formatDate } from '@/utils/formatters';
import type { StudentFormData } from '@/utils/validators';

type Student = Record<string, unknown>;

export function ManageStudents() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetStudents({ search });
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  const students = (data as Student[]) ?? [];

  const handleSubmit = async (formData: StudentFormData) => {
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setOpen(false);
    setEditing(null);
  };

  const handleEdit = (student: Student) => {
    setEditing(student);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const columns: ColumnDef<Student>[] = [
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
    { accessorKey: 'year', header: 'Year' },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => <span className="capitalize">{String(row.original.gender)}</span>,
    },
    {
      accessorKey: 'enrollmentDate',
      header: 'Enrolled',
      cell: ({ row }) => formatDate(String(row.original.enrollmentDate)),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
          {String(row.original.status)}
        </Badge>
      ),
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
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
        title="Manage Students"
        description={`${students.length} students enrolled`}
        actionLabel="Add Student"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />

      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchPlaceholder="Search students..."
        globalFilter={search}
        onGlobalFilterChange={setSearch}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <StudentForm
            defaultValues={editing as (StudentFormData & { id: string }) | undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
