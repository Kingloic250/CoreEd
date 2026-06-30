import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal, Building2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { useGetLecturers } from '@/hooks/useLecturers';
import { useGetFaculties, useCreateFaculty, useUpdateFaculty, useDeleteFaculty } from '@/hooks/useFaculties';

type Department = Record<string, unknown>;
type Faculty = Record<string, unknown>;

export function ManageDepartments() {
  const [tab, setTab] = useState('departments');

  return (
    <div>
      <PageHeader title="Departments & Faculties" description="Manage academic departments and their faculties" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="size-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="faculties" className="gap-2">
            <Layers className="size-4" /> Faculties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="faculties" className="mt-4">
          <FacultiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DepartmentsTab() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', headLecturerId: '', description: '' });
  const [initialForm, setInitialForm] = useState({ name: '', code: '', headLecturerId: '', description: '' });

  const { data, isLoading } = useGetDepartments();
  const { data: lecturers } = useGetLecturers();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const departments = (data as Department[]) ?? [];
  const lecturersList = (lecturers as Department[]) ?? [];

  const openAdd = () => {
    setEditing(null);
    const empty = { name: '', code: '', headLecturerId: '', description: '' };
    setForm(empty);
    setInitialForm(empty);
    setOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    const vals = {
      name: String(dept.name ?? ''),
      code: String(dept.code ?? ''),
      headLecturerId: String(dept.headLecturerId ?? ''),
      description: String(dept.description ?? ''),
    };
    setForm(vals);
    setInitialForm(vals);
    setOpen(true);
  };

  const formChanged = form.name !== initialForm.name || form.code !== initialForm.code || form.headLecturerId !== initialForm.headLecturerId || form.description !== initialForm.description;

  const handleSubmit = async () => {
    if (!form.name || !form.code) return;
    const payload = {
      name: form.name,
      code: form.code || null,
      headLecturerId: form.headLecturerId === 'none' ? null : form.headLecturerId || null,
      description: form.description || null,
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
    const l = lecturersList.find((l: any) => l.id === id);
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
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{departments.length} departments</p>
        <Button size="sm" onClick={openAdd}><Plus className="size-3.5 mr-1" /> Add Department</Button>
      </div>

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
                  {lecturersList.map((l: any) => (
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
              <Button type="button" onClick={handleSubmit} disabled={!form.name || !form.code || !formChanged || createMutation.isPending || updateMutation.isPending}>
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
    </>
  );
}

function FacultiesTab() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', description: '' });
  const [initialForm, setInitialForm] = useState({ name: '', code: '', departmentId: '', description: '' });

  const { data: departments } = useGetDepartments();
  const { data: faculties, isLoading } = useGetFaculties();
  const createMutation = useCreateFaculty();
  const updateMutation = useUpdateFaculty();
  const deleteMutation = useDeleteFaculty();

  const deptsList = (departments as any[]) ?? [];
  const facultiesList = (faculties as Faculty[]) ?? [];

  const openAdd = () => {
    setEditing(null);
    const empty = { name: '', code: '', departmentId: '', description: '' };
    setForm(empty);
    setInitialForm(empty);
    setOpen(true);
  };

  const openEdit = (fac: Faculty) => {
    setEditing(fac);
    const vals = {
      name: String(fac.name ?? ''),
      code: String(fac.code ?? ''),
      departmentId: String((fac as any).departmentId ?? ''),
      description: String(fac.description ?? ''),
    };
    setForm(vals);
    setInitialForm(vals);
    setOpen(true);
  };

  const formChanged = form.name !== initialForm.name || form.code !== initialForm.code || form.departmentId !== initialForm.departmentId || form.description !== initialForm.description;

  const handleSubmit = async () => {
    if (!form.name || !form.departmentId) return;
    const payload = { name: form.name, code: form.code || null, departmentId: form.departmentId, description: form.description || null };
    if (editing?.id) {
      await updateMutation.mutateAsync({ id: String(editing.id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
  };

  const getDeptName = (id: string) => {
    const d = deptsList.find((d: any) => d.id === id);
    return d ? d.name : id;
  };

  const columns: ColumnDef<Faculty>[] = [
    { accessorKey: 'name', header: 'Faculty' },
    { accessorKey: 'code', header: 'Code' },
    {
      accessorKey: 'departmentId',
      header: 'Department',
      cell: ({ row }) => getDeptName(String(row.original.departmentId)),
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
              onClick={() => setDeleteId(String((row.original as any).id))}
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{facultiesList.length} faculties</p>
        <Button size="sm" onClick={openAdd}><Plus className="size-3.5 mr-1" /> Add Faculty</Button>
      </div>

      <DataTable columns={columns} data={facultiesList} isLoading={isLoading} searchPlaceholder="Search faculties..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fac-name">Faculty Name</Label>
                <Input id="fac-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fac-code">Code</Label>
                <Input id="fac-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fac-dept">Department</Label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger id="fac-dept" aria-label="Select department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {deptsList.map((d: any) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {String(d.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fac-desc">Description</Label>
              <Textarea id="fac-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} disabled={!form.name || !form.departmentId || !formChanged || createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update Faculty' : 'Add Faculty'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Faculty"
        description="Are you sure you want to delete this faculty? This action cannot be undone."
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
