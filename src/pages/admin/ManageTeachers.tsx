// Admin: manage teachers with full CRUD, DataTable, and Sheet form
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TeacherForm } from '@/components/forms/TeacherForm';
import { useGetTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useTeachers';
import { formatDate } from '@/utils/formatters';
import type { TeacherFormData } from '@/utils/validators';

type Teacher = Record<string, unknown>;

export function ManageTeachers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetTeachers();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const teachers = (data as Teacher[]) ?? [];

  const handleSubmit = async (formData: TeacherFormData) => {
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setOpen(false);
    setEditing(null);
  };

  const columns: ColumnDef<Teacher>[] = [
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
    { accessorKey: 'subject', header: 'Subject' },
    { accessorKey: 'qualification', header: 'Qualification' },
    {
      accessorKey: 'joinDate',
      header: 'Join Date',
      cell: ({ row }) => formatDate(String(row.original.joinDate)),
    },
    {
      accessorKey: 'assignedClasses',
      header: 'Classes',
      cell: ({ row }) => {
        const cls = row.original.assignedClasses as string[];
        return <span className="text-sm text-muted-foreground">{cls?.length ?? 0} classes</span>;
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
        title="Manage Teachers"
        description={`${teachers.length} teachers on staff`}
        actionLabel="Add Teacher"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />

      <DataTable columns={columns} data={teachers} isLoading={isLoading} searchPlaceholder="Search teachers..." />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Teacher' : 'Add New Teacher'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TeacherForm
              defaultValues={editing as (TeacherFormData & { id: string }) | undefined}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Teacher"
        description="Are you sure you want to remove this teacher?"
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
