import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, MoreHorizontal, Shield, Users, GraduationCap, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useGetUsers, useUpdateUser, useResetPassword, useDeleteUser } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';

type UserRecord = Record<string, unknown>;

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  lecturer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  student: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const tabs = [
  { value: 'all', label: 'All', icon: Users },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'lecturer', label: 'Lecturer', icon: UserCheck },
  { value: 'student', label: 'Student', icon: GraduationCap },
];

export function ManageUsers() {
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useGetUsers();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [tab, setTab] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'student' });
  const [initialEditForm, setInitialEditForm] = useState({ name: '', email: '', role: 'student' });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const users = (data as UserRecord[]) ?? [];

  const filteredUsers = useMemo(() => {
    if (tab === 'all') return users;
    return users.filter((u) => String(u.role) === tab);
  }, [users, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length };
    for (const u of users) {
      const role = String(u.role);
      c[role] = (c[role] ?? 0) + 1;
    }
    return c;
  }, [users]);

  const openEdit = (u: UserRecord) => {
    setEditing(u);
    const vals = {
      name: String(u.name ?? ''),
      email: String(u.email ?? ''),
      role: String(u.role ?? 'student'),
    };
    setEditForm(vals);
    setInitialEditForm(vals);
    setEditOpen(true);
  };

  const editFormChanged = editForm.name !== initialEditForm.name || editForm.email !== initialEditForm.email || editForm.role !== initialEditForm.role;

  const handleEdit = async () => {
    if (!editing?.id) return;
    await updateMutation.mutateAsync({ id: String(editing.id), payload: editForm });
    setEditOpen(false);
  };

  const columns: ColumnDef<UserRecord>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = String(row.original.role);
        return (
          <Badge variant="outline" className={`capitalize ${roleColors[role] ?? ''}`}>
            <Shield className="size-3 mr-1" />
            {role}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original;
        const isSelf = String(u.id) === currentUser?.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(u)}>
                <Pencil className="size-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(String(u.id))}
                disabled={isSelf}
              >
                <Trash2 className="size-3.5" /> {isSelf ? 'Cannot delete self' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">{users.length} total accounts</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="mb-4 w-max min-w-full sm:w-auto">
            {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <Icon className="size-3.5" />
                {t.label}
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 min-w-[18px]">
                  {counts[t.value] ?? 0}
                </Badge>
              </TabsTrigger>
            );
          })}
            </TabsList>
          </div>

        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <DataTable
              columns={columns}
              data={filteredUsers}
              isLoading={isLoading}
              searchPlaceholder={`Search ${t.label.toLowerCase()} by name or email...`}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="um-name">Name</Label>
              <Input id="um-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="um-email">Email</Label>
              <Input id="um-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="um-role">Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger id="um-role" aria-label="Select role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || !editForm.name || !editForm.email || !editFormChanged}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete User"
        description="Are you sure you want to delete this user account? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
