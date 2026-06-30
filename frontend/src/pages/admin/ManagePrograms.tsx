import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetPrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/usePrograms';
import { useGetFaculties } from '@/hooks/useFaculties';

const DEGREE_TYPES = ['BSc', 'BA', 'BEng', 'LLB', 'MSc', 'MA', 'MBA', 'PhD', 'Diploma', 'Certificate'];

const defaultForm = { name: '', code: '', facultyId: '', degreeType: 'BSc', durationYears: 4, totalCreditsRequired: 120, description: '' };

export function ManagePrograms() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState(defaultForm);
  const { data: programs, isLoading } = useGetPrograms();
  const { data: faculties } = useGetFaculties();
  const { mutate: createProgram } = useCreateProgram();
  const { mutate: updateProgram } = useUpdateProgram();
  const { mutate: deleteProgram } = useDeleteProgram();

  const facultiesList = (faculties ?? []) as { id: string; name: string; department?: { name: string } }[];
  const programsList = (programs ?? []) as Record<string, unknown>[];

  const openCreate = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };

  const openEdit = (p: Record<string, unknown>) => {
    setEditing(p);
    setForm({
      name: String(p.name ?? ''),
      code: String(p.code ?? ''),
      facultyId: String(p.facultyId ?? ''),
      degreeType: String(p.degreeType ?? 'BSc'),
      durationYears: Number(p.durationYears ?? 4),
      totalCreditsRequired: Number(p.totalCreditsRequired ?? 120),
      description: String(p.description ?? ''),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      updateProgram({ id: String(editing.id), payload: form });
    } else {
      createProgram(form);
    }
    setDialogOpen(false);
  };

  return (
    <div>
      <PageHeader title="Manage Programs" description="Create and manage degree programs" actionLabel="New Program" actionIcon={Plus} onAction={openCreate} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : programsList.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No programs yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programsList.map((p) => (
            <Card key={String(p.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{String(p.name)}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {p.code && <Badge variant="outline" className="text-xs">{String(p.code)}</Badge>}
                      <Badge variant="secondary" className="text-xs">{String(p.degreeType)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => { if (confirm('Delete this program?')) deleteProgram(String(p.id)); }}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><GraduationCap className="size-3" /> {String(p.durationYears)} yr</span>
                  <span className="flex items-center gap-1"><BookOpen className="size-3" /> {String(p.totalCreditsRequired)} cr</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3" /> {String((p.faculty as Record<string, unknown> | undefined)?.name ?? '')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-px">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Program Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BSc Computer Science" />
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS-BSC" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Faculty</Label>
                <Select value={form.facultyId} onValueChange={(v) => setForm({ ...form, facultyId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    {facultiesList.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Degree Type</Label>
                <Select value={form.degreeType} onValueChange={(v) => setForm({ ...form, degreeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (years)</Label>
                <Input type="number" min={1} value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Total Credits Required</Label>
                <Input type="number" min={1} value={form.totalCreditsRequired} onChange={(e) => setForm({ ...form, totalCreditsRequired: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.facultyId}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
