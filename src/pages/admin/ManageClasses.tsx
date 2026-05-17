// Admin: manage classes with full CRUD
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetClasses, useCreateClass, useUpdateClass, useDeleteClass } from '@/hooks/useClasses';
import { useGetTeachers } from '@/hooks/useTeachers';
import { ClassForm } from '@/components/forms/ClassForm';
import type { ClassFormData } from '@/utils/validators';

type ClassRecord = Record<string, unknown>;

export function ManageClasses() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetClasses();
  const { data: teachers } = useGetTeachers();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  const classes = (data as ClassRecord[]) ?? [];
  const teachersList = (teachers as ClassRecord[]) ?? [];

  const getTeacherName = (teacherId: string) => {
    const t = teachersList.find((t) => t.id === teacherId) as Record<string, string> | undefined;
    return t ? `${t.firstName} ${t.lastName}` : teacherId;
  };

  const handleSubmit = async (formData: ClassFormData) => {
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setOpen(false);
    setEditing(null);
  };

  const columns: ColumnDef<ClassRecord>[] = [
    { accessorKey: 'name', header: 'Class Name' },
    { accessorKey: 'gradeLevel', header: 'Grade' },
    {
      accessorKey: 'teacherId',
      header: 'Teacher',
      cell: ({ row }) => getTeacherName(String(row.original.teacherId)),
    },
    {
      accessorKey: 'studentIds',
      header: 'Students',
      cell: ({ row }) => `${(row.original.studentIds as string[])?.length ?? 0} students`,
    },
    { accessorKey: 'room', header: 'Room' },
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
        title="Manage Classes"
        description={`${classes.length} classes active`}
        actionLabel="Add Class"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />
      <DataTable columns={columns} data={classes} isLoading={isLoading} searchPlaceholder="Search classes..." />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Class' : 'Add New Class'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ClassForm
              defaultValues={editing as (ClassFormData & { id: string }) | undefined}
              teachers={teachersList}
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
        title="Delete Class"
        description="Are you sure you want to delete this class?"
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
