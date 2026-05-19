import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetSemesters, useCreateSemester, useUpdateSemester, useDeleteSemester, useSetActiveSemester } from '@/hooks/useSemesters';

type Semester = Record<string, unknown>;

export function ManageSemesters() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: 'Semester 1', year: '', startDate: '', endDate: '' });
  const [initialForm, setInitialForm] = useState({ name: 'Semester 1', year: '', startDate: '', endDate: '' });

  const { data, isLoading } = useGetSemesters();
  const createMutation = useCreateSemester();
  const updateMutation = useUpdateSemester();
  const deleteMutation = useDeleteSemester();
  const setActiveMutation = useSetActiveSemester();

  const semesters = (data as Semester[]) ?? [];

  const openAdd = () => {
    setEditing(null);
    const empty = { name: 'Semester 1', year: '', startDate: '', endDate: '' };
    setForm(empty);
    setInitialForm(empty);
    setOpen(true);
  };

  const openEdit = (sem: Semester) => {
    setEditing(sem);
    const vals = {
      name: String(sem.name ?? 'Semester 1'),
      year: String(sem.year ?? ''),
      startDate: String(sem.startDate ?? ''),
      endDate: String(sem.endDate ?? ''),
    };
    setForm(vals);
    setInitialForm(vals);
    setOpen(true);
  };

  const formChanged = form.name !== initialForm.name || form.year !== initialForm.year || form.startDate !== initialForm.startDate || form.endDate !== initialForm.endDate;

  const handleSubmit = async () => {
    if (!form.name || !form.year || !form.startDate || !form.endDate) return;
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setOpen(false);
  };

  const activeSemester = semesters.find((s) => s.isActive);

  const columns: ColumnDef<Semester>[] = [
    {
      accessorKey: 'name',
      header: 'Semester',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span>{String(row.original.name)}</span>
          {row.original.isActive && (
            <Badge className="ml-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-1.5 py-0">
              Active
            </Badge>
          )}
        </div>
      ),
    },
    { accessorKey: 'year', header: 'Academic Year' },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => String(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => String(row.original.endDate),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const sem = row.original;
        const isActive = sem.isActive;
        return (
          <div className="flex items-center gap-2">
            {!isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveMutation.mutate(String(sem.id))}
                disabled={setActiveMutation.isPending}
              >
                <Check className="size-3 mr-1" />
                Set Active
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(sem)}>
                  <Pencil className="size-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(String(sem.id))}
                >
                  <Trash2 className="size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Semesters"
        description={`${semesters.length} semesters · ${activeSemester ? `Active: ${activeSemester.name} ${activeSemester.year}` : 'No active semester'}`}
        actionLabel="Add Semester"
        actionIcon={Plus}
        onAction={openAdd}
      />

      <DataTable columns={columns} data={semesters} isLoading={isLoading} searchPlaceholder="Search semesters..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Semester' : 'Add New Semester'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sem-name">Semester</Label>
                <Select value={form.name} onValueChange={(v) => setForm({ ...form, name: v })}>
                  <SelectTrigger id="sem-name" aria-label="Select semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sem-year">Academic Year</Label>
                <Input id="sem-year" placeholder="e.g. 2025/2026" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sem-start">Start Date</Label>
                <Input id="sem-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sem-end">End Date</Label>
                <Input id="sem-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} disabled={!form.name || !form.year || !form.startDate || !form.endDate || !formChanged || createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update Semester' : 'Add Semester'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Semester"
        description="Are you sure you want to delete this semester? This action cannot be undone."
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
