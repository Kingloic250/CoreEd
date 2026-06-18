import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Pencil, Calculator, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses, useGetCourse } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetGrades, useCreateGrade, useSubmitGrades } from '@/hooks/useGrades';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester, useGetSemesters } from '@/hooks/useSemesters';
import { useGetGroups } from '@/hooks/useGroups';
import { SEMESTERS } from '@/utils/constants';
import { getLetterGrade, getGradeColor } from '@/utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
  submitted: { label: 'Submitted', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

type ComponentScoreMap = Record<string, number>;

function calcWeightedScore(components: { name: string; maxScore: number; weight: number }[], scores: ComponentScoreMap): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const comp of components) {
    const val = scores[comp.name];
    if (val !== undefined && val >= 0) {
      weighted += (val / comp.maxScore) * comp.weight;
    }
    totalWeight += comp.weight;
  }
  return totalWeight > 0 ? (weighted / totalWeight) * 100 : 0;
}

export function GradeBook() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState<ComponentScoreMap>({});
  const [saving, setSaving] = useState(false);

  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const { data: allSemesters } = useGetSemesters();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;
  const semesterId = activeSemester ? (activeSemester as Record<string, unknown>).id as string : undefined;

  const semList = (allSemesters as Record<string, unknown>[]) ?? [];

  const academicYears = useMemo(
    () => [...new Set(semList.map((s) => String(s.year)))].sort(),
    [semList]
  );

  const semesterNamesForYear = useMemo(() => {
    if (!selectedAcademicYear) return undefined;
    return semList.filter((s) => String(s.year) === selectedAcademicYear).map((s) => String(s.name));
  }, [selectedAcademicYear, semList]);

  useEffect(() => {
    if (activeSemester && !selectedAcademicYear) {
      setSelectedAcademicYear((activeSemester as Record<string, unknown>).year as string);
    }
  }, [activeSemester]);

  const { data: courses } = useGetCourses(
    lecturerId && semesterId ? { lecturerId, semesterId } : undefined
  );
  const { data: courseDetail } = useGetCourse(courseFilter || undefined);
  const { data: gradesData, isLoading: gradesLoading } = useGetGrades(
    courseFilter ? { courseId: courseFilter, semester: semesterFilter || undefined, groupId: groupFilter || undefined } : { semester: semesterFilter || undefined }
  );
  const { data: students } = useGetStudents({});
  const createGrade = useCreateGrade();
  const submitGradesMutation = useSubmitGrades();

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const studentList = (students as Record<string, unknown>[]) ?? [];
  const allGrades = (gradesData as Record<string, unknown>[]) ?? [];

  const gradingComponents = (courseDetail as Record<string, unknown>)?.gradingComponents as
    { name: string; maxScore: number; weight: number }[] | undefined;

  const { data: courseGroups } = useGetGroups(courseFilter ? { courseId: courseFilter } : undefined);
  const groupsList = (courseGroups as { id: string; name: string }[]) ?? [];

  const getStudentName = (id: string) => {
    const s = studentList.find((s) => String(s.id) === id);
    return s ? `${String(s.firstName)} ${String(s.lastName)}` : id;
  };

  const lecturerCourseIds = useMemo(
    () => new Set(courseList.map((c) => String(c.id))),
    [courseList]
  );

  const grades = useMemo(
    () => allGrades.filter((g) => {
      if (!lecturerCourseIds.has(String(g.courseId))) return false;
      if (semesterNamesForYear && !semesterNamesForYear.includes(String(g.semester))) return false;
      return true;
    }),
    [allGrades, lecturerCourseIds, semesterNamesForYear]
  );

  const showComponents = !!courseFilter && !!gradingComponents;

  const hasDraftGrades = grades.some((g) => String(g.status) === 'draft');

  const startEdit = (g: Record<string, unknown>) => {
    if (String(g.status) !== 'draft') {
      toast.error('Only draft grades can be edited');
      return;
    }
    setEditingId(String(g.id));
    const stored = g.componentScores as ComponentScoreMap | undefined;
    if (stored && gradingComponents) {
      const map: ComponentScoreMap = {};
      for (const comp of gradingComponents) {
        map[comp.name] = stored[comp.name] ?? 0;
      }
      setEditScores(map);
    } else {
      setEditScores({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditScores({});
  };

  const handleSaveEdit = async (g: Record<string, unknown>) => {
    if (showComponents && gradingComponents) {
      const numericScores: ComponentScoreMap = {};
      for (const comp of gradingComponents) {
        numericScores[comp.name] = editScores[comp.name] ?? 0;
      }
      const weightedScore = Math.round(calcWeightedScore(gradingComponents, numericScores) * 100) / 100;
      setSaving(true);
      try {
        await createGrade.mutateAsync({
          studentId: String(g.studentId),
          courseId: String(g.courseId),
          groupId: String(g.groupId ?? ''),
          semester: String(g.semester),
          score: weightedScore,
          maxScore: 100,
          grade: getLetterGrade(weightedScore),
          componentScores: numericScores,
          comments: String(g.comments ?? ''),
        });
        toast.success('Grade updated');
        setEditingId(null);
      } catch {
        toast.error('Failed to update grade');
      } finally {
        setSaving(false);
      }
    } else {
      const score = Number(editScores._total);
      if (isNaN(score) || score < 0 || score > 100) {
        toast.error('Score must be between 0 and 100');
        return;
      }
      setSaving(true);
      try {
        await createGrade.mutateAsync({
          studentId: String(g.studentId),
          courseId: String(g.courseId),
          groupId: String(g.groupId ?? ''),
          semester: String(g.semester),
          score,
          maxScore: 100,
          grade: getLetterGrade(score),
          componentScores: g.componentScores,
          comments: String(g.comments ?? ''),
        });
        toast.success('Grade updated');
        setEditingId(null);
      } catch {
        toast.error('Failed to update grade');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmitForReview = () => {
    if (!courseFilter) return;
    submitGradesMutation.mutate({
      courseId: courseFilter,
      groupId: groupFilter || undefined,
      semester: semesterFilter || undefined,
    });
  };

  return (
    <div>
      <PageHeader title="Grade Book" description="View and edit grades for your courses" />

      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="space-y-1.5 min-w-[180px]">
          <Label className="text-xs">Academic Year</Label>
          <Select value={selectedAcademicYear} onValueChange={(v) => { setSelectedAcademicYear(v); setEditingId(null); }}>
            <SelectTrigger aria-label="Filter by academic year"><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs">Course</Label>
          <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setGroupFilter(''); setEditingId(null); }}>
            <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setCourseFilter('')}>All courses</SelectItem>
              {courseList.map((c) => (<SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs">Group</Label>
          <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setEditingId(null); }} disabled={!courseFilter}>
            <SelectTrigger aria-label="Filter by group"><SelectValue placeholder="All groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setGroupFilter('')}>All groups</SelectItem>
              {groupsList.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-[160px]">
          <Label className="text-xs">Semester</Label>
          <Select value={semesterFilter} onValueChange={(v) => { setSemesterFilter(v); setEditingId(null); }}>
            <SelectTrigger aria-label="Filter by semester"><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setSemesterFilter('')}>All semesters</SelectItem>
              {SEMESTERS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {courseFilter && hasDraftGrades && (
          <div className="flex items-center gap-2 pb-0.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSubmitForReview}
              disabled={submitGradesMutation.isPending}
            >
              <Send className="size-4 mr-1" />
              Submit Drafts for Review
            </Button>
          </div>
        )}
      </div>

      {gradesLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : grades.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No grades found for your courses.</p>
      ) : showComponents ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calculator className="size-3.5" />
              {gradingComponents.map((c) => `${c.name} (${c.weight}%)`).join(' + ')}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 px-4 font-medium min-w-[160px]">Student</th>
                  {gradingComponents.map((comp) => (
                    <th key={comp.name} className="py-2 px-2 font-medium text-center min-w-[80px]">
                      {comp.name}<div className="text-[10px] opacity-60">/{comp.maxScore}</div>
                    </th>
                  ))}
                  <th className="py-2 px-2 font-medium text-center min-w-[60px]">Total</th>
                  <th className="py-2 px-2 font-medium text-center min-w-[50px]">Grade</th>
                  <th className="py-2 px-2 font-medium text-center min-w-[70px]">Status</th>
                  <th className="py-2 px-2 w-16" />
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => {
                  const isEditing = editingId === String(g.id);
                  const storedComponents = g.componentScores as ComponentScoreMap | undefined;
                  const currentScores = isEditing ? editScores : (storedComponents ?? {});
                  const total = gradingComponents ? calcWeightedScore(gradingComponents, currentScores) : Number(g.score);
                  const letter = getLetterGrade(total);
                  const color = getGradeColor(letter);
                  const status = String(g.status ?? 'draft');
                  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
                  const canEdit = status === 'draft';

                  return (
                    <tr key={String(g.id)} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-medium">{getStudentName(String(g.studentId))}</span>
                        <p className="text-xs text-muted-foreground">{String(g.semester)}</p>
                      </td>
                      {gradingComponents.map((comp) => {
                        const val = isEditing ? (editScores[comp.name] ?? '') : (storedComponents?.[comp.name] ?? '');
                        return (
                          <td key={comp.name} className="py-2 px-2 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                max={comp.maxScore}
                                step={0.5}
                                value={val}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === '' || (/^\d{0,3}(\.\d{0,1})?$/.test(v) && Number(v) <= comp.maxScore)) {
                                    setEditScores((prev) => ({ ...prev, [comp.name]: v === '' ? 0 : Number(v) }));
                                  }
                                }}
                                className="w-16 h-8 text-sm text-center mx-auto"
                              />
                            ) : (
                              <span className="text-sm font-mono">{val !== '' ? val : '-'}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-mono text-sm font-medium">
                        {total.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className={`w-8 justify-center ${color}`}>{letter}</Badge>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge className={`${statusCfg.className} text-xs`}>{statusCfg.label}</Badge>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(g)} disabled={saving}>
                              {saving ? <Spinner className="size-3.5" /> : <Save className="size-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(g)} disabled={!canEdit}>
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {grades.map((g) => {
                const isEditing = editingId === String(g.id);
                const score = isEditing ? Number(editScores._total ?? g.score) : Number(g.score);
                const letter = getLetterGrade(score);
                const color = getGradeColor(letter);
                const status = String(g.status ?? 'draft');
                const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
                const canEdit = status === 'draft';

                return (
                  <div key={String(g.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getStudentName(String(g.studentId))}</p>
                      <p className="text-xs text-muted-foreground">{String(g.subject)} — {String(g.semester)}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={editScores._total ?? ''}
                          onChange={(e) => setEditScores({ _total: Number(e.target.value) })}
                          className="w-20 h-8 text-sm text-center"
                          autoFocus
                        />
                        <Badge variant="outline" className={`w-8 justify-center ${color}`}>{letter}</Badge>
                        <Badge className={`${statusCfg.className} text-xs`}>{statusCfg.label}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(g)} disabled={saving}>
                          {saving ? <Spinner className="size-3.5" /> : <Save className="size-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-mono w-8 text-right">{String(g.score)}</span>
                        <Badge variant="outline" className={`w-8 justify-center ${color}`}>{String(g.grade)}</Badge>
                        <Badge className={`${statusCfg.className} text-xs`}>{statusCfg.label}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(g)} disabled={!canEdit}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
