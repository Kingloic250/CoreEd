import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';

export function ManageRooms() {
  const { data: rooms, isLoading } = useGetRooms();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();
  const roomsList = (rooms ?? []);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; name: string; code: string; capacity: number; building: string; description: string }>({
    name: '', code: '', capacity: 0, building: '', description: '',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing({ name: '', code: '', capacity: 0, building: '', description: '' });
    setEditOpen(true);
  };

  const openEdit = (room: typeof roomsList[number]) => {
    setEditing({
      id: room.id, name: room.name, code: room.code ?? '',
      capacity: room.capacity, building: room.building ?? '', description: room.description ?? '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) return;
    const payload = {
      name: editing.name, code: editing.code || null,
      capacity: editing.capacity, building: editing.building || null,
      description: editing.description || null,
    };
    if (editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Management"
        description="Manage lecture rooms and their availability"
        actionLabel="Add Room"
        actionIcon={Plus}
        onAction={openCreate}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Building</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : roomsList.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <Building2 className="size-8 mx-auto mb-2 opacity-30" />
                <p>No rooms yet. Click "Add Room" to create one.</p>
              </TableCell></TableRow>
            ) : (
              roomsList.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-muted-foreground">{room.code ?? '—'}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell className="text-muted-foreground">{room.building ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(room)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(room.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Room Name *</Label>
              <Input id="room-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Room 101" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-code">Code</Label>
                <Input id="room-code" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="e.g. A101" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-capacity">Capacity</Label>
                <Input id="room-capacity" type="number" min={0} value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-building">Building</Label>
              <Input id="room-building" value={editing.building} onChange={(e) => setEditing({ ...editing, building: e.target.value })} placeholder="e.g. Science Block" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-desc">Description</Label>
              <Input id="room-desc" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editing.name.trim() || createMutation.isPending || updateMutation.isPending}>
              {editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Room"
        description="Are you sure you want to delete this room? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}