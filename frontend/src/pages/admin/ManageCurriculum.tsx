import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetPrograms, useGetCurricula, useCreateCurriculum, useUpdateCurriculum, useDeleteCurriculum, useGetCurriculumCourses, useAddProgramCourse, useDeleteProgramCourse } from '@/hooks/usePrograms';
import { useCreateCourse } from '@/hooks/useCourses';

const YEARS = [1, 2, 3, 4, 5, 6];
const SEMESTERS = [1, 2];

export function ManageCurriculum() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('');
  const [curDialog, setCurDialog] = useState(false);
  const [courseDialog, setCourseDialog] = useState(false);
  const [curForm, setCurForm] = useState({ name: '', version: '', isActive: false, totalCredits: 0 });
  const [editingCur, setEditingCur] = useState<Record<string, unknown> | null>(null);
  const [courseForm, setCourseForm] = useState({ courseName: '', courseCode: '', credits: 3, year: 1, semester: 1, isCore: true });
  const { data: programs } = useGetPrograms();
  const { data: curricula, isLoading: curLoading } = useGetCurricula(selectedProgram);
  const { data: curriculumCourses, isLoading: ccLoading } = useGetCurriculumCourses(selectedCurriculum);
  const { mutate: createCurriculum } = useCreateCurriculum();
  const { mutate: updateCurriculum } = useUpdateCurriculum();
  const { mutate: deleteCurriculum } = useDeleteCurriculum();
  const { mutateAsync: createCourse } = useCreateCourse();
  const { mutateAsync: addCourse } = useAddProgramCourse();
  const { mutate: deleteCourse } = useDeleteProgramCourse();

  const programsList = (programs ?? []) as Record<string, unknown>[];
  const curriculaList = (curricula ?? []) as Record<string, unknown>[];
  const ccList = (curriculumCourses ?? []) as Record<string, unknown>[];

  const activeCurriculum = curriculaList.find((c) => c.isActive) as Record<string, unknown> | undefined;
  const selectedCurData = curriculaList.find((c) => c.id === selectedCurriculum) as Record<string, unknown> | undefined;

  const openCurCreate = () => {
    setEditingCur(null);
    setCurForm({ name: '', version: '', isActive: false, totalCredits: 0 });
    setCurDialog(true);
  };

  const openCurEdit = (c: Record<string, unknown>) => {
    setEditingCur(c);
    setCurForm({
      name: String(c.name ?? ''),
      version: String(c.version ?? ''),
      isActive: Boolean(c.isActive),
      totalCredits: Number(c.totalCredits ?? 0),
    });
    setCurDialog(true);
  };

  const handleCurSave = () => {
    if (editingCur) {
      updateCurriculum({ id: String(editingCur.id), payload: curForm });
    } else {
      createCurriculum({ programId: selectedProgram, payload: curForm });
    }
    setCurDialog(false);
  };

  const handleAddCourse = async () => {
    try {
      const newCourse = await createCourse({ name: courseForm.courseName, code: courseForm.courseCode || undefined, credits: courseForm.credits });
      const courseId = (newCourse as Record<string, unknown>).id as string;
      await addCourse({ curriculumId: selectedCurriculum, courseId, year: courseForm.year, semester: courseForm.semester, isCore: courseForm.isCore });
      setCourseDialog(false);
      setCourseForm({ courseName: '', courseCode: '', credits: 3, year: 1, semester: 1, isCore: true });
    } catch { /* toast handled by hook */ }
  };

  const coursesByYear = ccList.reduce<Record<number, Record<string, unknown>[]>>((acc, pc) => {
    const y = Number(pc.year);
    if (!acc[y]) acc[y] = [];
    acc[y].push(pc);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Manage Curriculum" description="Map courses to program curricula by year and semester">
        {!selectedProgram && <p className="text-sm text-muted-foreground">Select a program to manage its curriculum</p>}
      </PageHeader>

      {/* Program selector */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={selectedProgram} onValueChange={(v) => { setSelectedProgram(v); setSelectedCurriculum(''); }}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Select a program..." /></SelectTrigger>
          <SelectContent>
            {programsList.map((p) => (
              <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name)} ({String(p.degreeType)})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProgram && (
          <Button variant="outline" size="sm" onClick={openCurCreate}><Plus className="size-3.5" /> New Curriculum</Button>
        )}
      </div>

      {selectedProgram && (
        <>
          {/* Curriculum versions list */}
          <div className="flex flex-wrap gap-2 mb-6">
            {curLoading ? <Skeleton className="h-8 w-40" /> : curriculaList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No curricula yet. Create one.</p>
            ) : curriculaList.map((c) => (
              <button
                key={String(c.id)}
                onClick={() => setSelectedCurriculum(String(c.id))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedCurriculum === String(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                } ${c.isActive ? 'ring-1 ring-emerald-500' : ''}`}
              >
                <Layers className="size-3.5" />
                {String(c.name)} v{String(c.version)}
                {c.isActive && <CheckCircle2 className="size-3 text-emerald-500" />}
                <button className="ml-1 hover:text-destructive" onClick={(e) => { e.stopPropagation(); openCurEdit(c); }}>
                  <Pencil className="size-3" />
                </button>
                <button className="hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this curriculum?')) deleteCurriculum(String(c.id)); }}>
                  <Trash2 className="size-3" />
                </button>
              </button>
            ))}
          </div>

          {selectedCurriculum && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{String(selectedCurData?.name ?? '')}</h2>
                  <p className="text-xs text-muted-foreground">Version {String(selectedCurData?.version ?? '')} &middot; {String(selectedCurData?.totalCredits ?? 0)} total credits</p>
                </div>
                <Button size="sm" onClick={() => { setCourseForm({ courseName: '', courseCode: '', credits: 3, year: 1, semester: 1, isCore: true }); setCourseDialog(true); }}><Plus className="size-3.5" /> Add Course</Button>
              </div>

              {ccLoading ? (
                <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
              ) : ccList.length === 0 ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground">No courses mapped yet.</CardContent></Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(coursesByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, pcs]) => (
                    <Card key={year}>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Year {year}</CardTitle></CardHeader>
                      <CardContent>
                        {[1, 2].map((sem) => {
                          const semCourses = pcs.filter((pc) => Number(pc.semester) === sem);
                          if (semCourses.length === 0) return null;
                          return (
                            <div key={sem} className="mb-3 last:mb-0">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Semester {sem}</p>
                              <div className="space-y-1.5">
                                {semCourses.map((pc) => {
                                  const course = pc.course as Record<string, unknown> | undefined;
                                  return (
                                    <div key={String(pc.id)} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span>{String(course?.name ?? '')}</span>
                                        <Badge variant="outline" className="text-xs">{String(course?.credits ?? 0)} cr</Badge>
                                        {pc.isCore ? (
                                          <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0">Core</Badge>
                                        ) : (
                                          <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0">Elective</Badge>
                                        )}
                                      </div>
                                      <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => { if (confirm('Remove this course?')) deleteCourse(String(pc.id)); }}>
                                        <XCircle className="size-3.5" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Curriculum dialog */}
      <Dialog open={curDialog} onOpenChange={setCurDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingCur ? 'Edit Curriculum' : 'New Curriculum'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={curForm.name} onChange={(e) => setCurForm({ ...curForm, name: e.target.value })} placeholder="2024 Curriculum" />
              </div>
              <div className="space-y-1.5">
                <Label>Version</Label>
                <Input value={curForm.version} onChange={(e) => setCurForm({ ...curForm, version: e.target.value })} placeholder="1.0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Total Credits</Label>
              <Input type="number" value={curForm.totalCredits} onChange={(e) => setCurForm({ ...curForm, totalCredits: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={curForm.isActive} onCheckedChange={(v) => setCurForm({ ...curForm, isActive: v })} />
              <Label>Active curriculum</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurDialog(false)}>Cancel</Button>
            <Button onClick={handleCurSave} disabled={!curForm.name || !curForm.version}>{editingCur ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add course dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Course to Curriculum</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Course Name</Label>
              <Input value={courseForm.courseName} onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })} placeholder="e.g. Data Structures" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code (optional)</Label>
                <Input value={courseForm.courseCode} onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })} placeholder="e.g. CS201" />
              </div>
              <div className="space-y-1.5">
                <Label>Credits</Label>
                <Input type="number" min={1} max={30} value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select value={String(courseForm.year)} onValueChange={(v) => setCourseForm({ ...courseForm, year: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={String(courseForm.semester)} onValueChange={(v) => setCourseForm({ ...courseForm, semester: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={courseForm.isCore} onCheckedChange={(v) => setCourseForm({ ...courseForm, isCore: v })} />
              <Label>Core course (compulsory)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCourse} disabled={!courseForm.courseName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
