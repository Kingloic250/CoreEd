import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { useGetLecturers } from '@/hooks/useLecturers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Department = Record<string, unknown>;

export function ManageDepartments() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', headLecturerId: '', description: '' });

  const { data, isLoading } = useGetDepartments();
  const { data: lecturers } = useGetLecturers();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const departments = (data as Department[]) ?? [];
  const lecturersList = (lecturers as Department[]) ?? [];

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', headLecturerId: '', description: '' });
    setOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: String(dept.name ?? ''),
      code: String(dept.code ?? ''),
      headLecturerId: String(dept.headLecturerId ?? ''),
      description: String(dept.description ?? ''),
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) return;
    const payload = {
      ...form,
      headLecturerId: form.headLecturerId === 'none' ? null : form.headLecturerId,
    };
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
  };

  const getHeadName = (id: string | null) => {
    if (!id) return '—';
    const l = lecturersList.find((l) => l.id === id);
    return l ? `${l.firstName} ${l.lastName}` : id;
  };

  const columns: ColumnDef<Department>[] = [
    { accessorKey: 'name', header: 'Department' },
    { accessorKey: 'code', header: 'Code' },
    {
      accessorKey: 'headLecturerId',
      header: 'Head of Department',
      cell: ({ row }) => getHeadName(String(row.original.headLecturerId)),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1">{String(row.original.description ?? '')}</span>
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
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
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
        title="Manage Departments"
        description={`${departments.length} departments`}
        actionLabel="Add Department"
        actionIcon={Plus}
        onAction={openAdd}
      />

      <DataTable columns={columns} data={departments} isLoading={isLoading} searchPlaceholder="Search departments..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dept-name">Department Name</Label>
                <Input id="dept-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dept-code">Code</Label>
                <Input id="dept-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-head">Head of Department</Label>
              <Select value={form.headLecturerId} onValueChange={(v) => setForm({ ...form, headLecturerId: v })}>
                <SelectTrigger id="dept-head" aria-label="Select head of department">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {lecturersList.map((l) => (
                    <SelectItem key={String(l.id)} value={String(l.id)}>
                      {String(l.firstName)} {String(l.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-desc">Description</Label>
              <Textarea id="dept-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} disabled={!form.name || !form.code || createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update Department' : 'Add Department'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
