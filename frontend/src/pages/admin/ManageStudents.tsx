// Admin: manage students with full CRUD, DataTable, and Sheet form
import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const [statusTab, setStatusTab] = useState('all');

  const filteredStudents = useMemo(() => {
    if (statusTab === 'all') return students;
    return students.filter((s) => String(s.status) === statusTab);
  }, [students, statusTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: students.length };
    for (const s of students) {
      const st = String(s.status);
      c[st] = (c[st] ?? 0) + 1;
    }
    return c;
  }, [students]);

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
    { accessorKey: 'studentNumber', header: 'Student #' },
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
      cell: ({ row }) => {
        const student = row.original;
        return (
          <Select
            value={String(student.status)}
            onValueChange={(v) =>
              updateMutation.mutate({ id: String(student.id), payload: { status: v } })
            }
          >
            <SelectTrigger
              className={`h-7 w-[120px] text-xs gap-1 ${
                student.status === 'active'
                  ? 'text-green-700 dark:text-green-400'
                  : student.status === 'graduated'
                  ? 'text-blue-700 dark:text-blue-400'
                  : student.status === 'expelled'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}
            >
              <span className={`size-1.5 rounded-full shrink-0 ${
                student.status === 'active'
                  ? 'bg-green-500'
                  : student.status === 'graduated'
                  ? 'bg-blue-500'
                  : student.status === 'expelled'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-green-500" /> Active</span>
              </SelectItem>
              <SelectItem value="inactive">
                <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-gray-400" /> Inactive</span>
              </SelectItem>
              <SelectItem value="graduated">
                <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-500" /> Graduated</span>
              </SelectItem>
              <SelectItem value="expelled">
                <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-red-500" /> Expelled</span>
              </SelectItem>
            </SelectContent>
          </Select>
        );
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
        description={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}${statusTab !== 'all' ? ` (${statusTab})` : ''}`}
        actionLabel="Add Student"
        actionIcon={Plus}
        onAction={() => { setEditing(null); setOpen(true); }}
      />

      <Tabs value={statusTab} onValueChange={setStatusTab} className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="w-max min-w-full sm:w-auto">
            <TabsTrigger value="all">All ({counts.all ?? 0})</TabsTrigger>
            <TabsTrigger value="active" className="text-green-700 dark:text-green-400">Active ({counts.active ?? 0})</TabsTrigger>
            <TabsTrigger value="inactive" className="text-muted-foreground">Inactive ({counts.inactive ?? 0})</TabsTrigger>
            <TabsTrigger value="graduated" className="text-blue-700 dark:text-blue-400">Graduated ({counts.graduated ?? 0})</TabsTrigger>
            <TabsTrigger value="expelled" className="text-red-700 dark:text-red-400">Expelled ({counts.expelled ?? 0})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={statusTab}>
          <DataTable
            columns={columns}
            data={filteredStudents}
            isLoading={isLoading}
            searchPlaceholder="Search students..."
            globalFilter={search}
            onGlobalFilterChange={setSearch}
          />
        </TabsContent>
      </Tabs>

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
