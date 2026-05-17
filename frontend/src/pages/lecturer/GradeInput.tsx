import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Save, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses, useGetCourse } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useGetGrades, useCreateGrade } from '@/hooks/useGrades';
import { useGetCurrentLecturer } from '@/hooks/useLecturers';
import { useGetActiveSemester, useGetSemesters } from '@/hooks/useSemesters';
import { useGetDepartments } from '@/hooks/useDepartments';
import { SEMESTERS } from '@/utils/constants';
import { getLetterGrade, getGradeColor } from '@/utils/formatters';

type ComponentScoreMap = Record<string, string>;

function calcWeightedScore(components: { name: string; maxScore: number; weight: number }[], scores: ComponentScoreMap): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const comp of components) {
    const val = parseFloat(scores[comp.name]);
    if (!isNaN(val) && val >= 0) {
      weighted += (val / comp.maxScore) * comp.weight;
    }
    totalWeight += comp.weight;
  }
  return totalWeight > 0 ? (weighted / totalWeight) * 100 : 0;
}

export function GradeInput() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [componentScores, setComponentScores] = useState<Record<string, ComponentScoreMap>>({});
  const [saving, setSaving] = useState(false);

  const { data: currentLecturer } = useGetCurrentLecturer();
  const { activeSemester } = useGetActiveSemester();
  const { data: allSemesters } = useGetSemesters();
  const { data: departments } = useGetDepartments();
  const lecturerId = currentLecturer ? (currentLecturer as Record<string, unknown>).id : undefined;

  const semList = (allSemesters as Record<string, unknown>[]) ?? [];
  const deptList = (departments as Record<string, unknown>[]) ?? [];

  const academicYears = useMemo(
    () => [...new Set(semList.map((s) => String(s.year)))].sort(),
    [semList]
  );

  const semesterIdsForYear = useMemo(() => {
    if (!selectedAcademicYear) return undefined;
    return semList.filter((s) => String(s.year) === selectedAcademicYear).map((s) => String(s.id));
  }, [selectedAcademicYear, semList]);

  useEffect(() => {
    if (activeSemester && !selectedAcademicYear) {
      setSelectedAcademicYear((activeSemester as Record<string, unknown>).year as string);
    }
    if (activeSemester && !selectedSemester) {
      setSelectedSemester((activeSemester as Record<string, unknown>).name as string);
    }
  }, [activeSemester]);

  useEffect(() => {
    setSelectedCourse('');
    setComponentScores({});
  }, [selectedAcademicYear]);

  const { data: courses, isLoading: coursesLoading } = useGetCourses(
    lecturerId ? { lecturerId } : undefined
  );
  const { data: courseDetail } = useGetCourse(selectedCourse || undefined);
  const { data: gradesData } = useGetGrades(
    selectedCourse ? { courseId: selectedCourse, semester: selectedSemester || undefined } : {}
  );
  const { data: students, isLoading: studentsLoading } = useGetStudents({});
  const createGrade = useCreateGrade();

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];
  const existingGrades = (gradesData as Record<string, unknown>[]) ?? [];

  const filteredCourses = semesterIdsForYear
    ? courseList.filter((c) => semesterIdsForYear.includes(String(c.semesterId)))
    : [];

  const gradingComponents = (courseDetail as Record<string, unknown>)?.gradingComponents as
    { name: string; maxScore: number; weight: number }[] | undefined;

  const selectedCourseData = filteredCourses.find((c) => String(c.id) === selectedCourse);
  const courseStudentIds = (selectedCourseData?.studentIds as string[]) ?? [];
  const courseStudents = allStudents.filter((s) => courseStudentIds.includes(String(s.id)));

  const derivedSubject = selectedCourseData
    ? (deptList.find((d) => String(d.id) === String(selectedCourseData.department))?.name as string) ?? ''
    : '';

  const canShow = selectedAcademicYear && selectedCourse && selectedSemester;

  // Pre-fill component scores from existing grades
  useEffect(() => {
    if (!selectedCourse || !selectedSemester || existingGrades.length === 0) return;
    const newScores: Record<string, ComponentScoreMap> = {};
    for (const g of existingGrades) {
      const sid = String(g.studentId);
      const stored = g.componentScores as Record<string, number> | undefined;
      if (stored) {
        const map: ComponentScoreMap = {};
        for (const [name, val] of Object.entries(stored)) {
          map[name] = String(val);
        }
        newScores[sid] = map;
      }
    }
    setComponentScores((prev) => ({ ...prev, ...newScores }));
  }, [selectedCourse, selectedSemester, existingGrades]);

  const handleScoreChange = (studentId: string, componentName: string, value: string) => {
    if (value === '' || (/^\d{0,3}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= (gradingComponents?.find(c => c.name === componentName)?.maxScore ?? 100))) {
      setComponentScores((prev) => ({
        ...prev,
        [studentId]: { ...(prev[studentId] ?? {}), [componentName]: value },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedSemester || !gradingComponents) return;

    const toSave = courseStudents.filter((s) => {
      const scores = componentScores[String(s.id)];
      return scores && Object.values(scores).some((v) => v !== '');
    });
    if (toSave.length === 0) { toast.error('Enter at least one score'); return; }

    setSaving(true);
    try {
      await Promise.all(
        toSave.map((s) => {
          const sid = String(s.id);
          const raw = componentScores[sid] ?? {};
          const numericScores: Record<string, number> = {};
          for (const comp of gradingComponents) {
            const val = parseFloat(raw[comp.name]);
            numericScores[comp.name] = isNaN(val) ? 0 : val;
          }
          const weightedScore = Math.round(calcWeightedScore(gradingComponents, raw) * 100) / 100;
          return createGrade.mutateAsync({
            studentId: sid,
            courseId: selectedCourse,
            subject: derivedSubject,
            semester: selectedSemester,
            score: weightedScore,
            maxScore: 100,
            grade: getLetterGrade(weightedScore),
            componentScores: numericScores,
            comments: '',
          });
        })
      );
      toast.success(`Grades saved for ${toSave.length} student(s)`);
    } catch {
      toast.error('Failed to save some grades');
    } finally {
      setSaving(false);
    }
  };

  const getStudentTotal = (studentId: string) => {
    if (!gradingComponents) return null;
    const raw = componentScores[studentId] ?? {};
    return calcWeightedScore(gradingComponents, raw);
  };

  return (
    <div>
      <PageHeader title="Grade Input" description="Enter component scores with automatic weighted calculation" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger aria-label="Select academic year"><SelectValue placeholder="Select academic year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Course</Label>
                {coursesLoading ? <Skeleton className="h-9" /> : (
                  <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedAcademicYear}>
                    <SelectTrigger aria-label="Select course"><SelectValue placeholder={selectedAcademicYear ? 'Select course' : 'Select year first'} /></SelectTrigger>
                    <SelectContent>
                      {filteredCourses.map((c) => (<SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger aria-label="Select semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {canShow && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {String(selectedCourseData?.name)} — {selectedSemester} ({selectedAcademicYear})
                </CardTitle>
                {gradingComponents && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calculator className="size-3.5" />
                    {gradingComponents.map((c) => `${c.name} (${c.weight}%)`).join(' + ')}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : courseStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students in this course.</p>
              ) : !gradingComponents ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading grading components...</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-3 font-medium min-w-[160px]">Student</th>
                          {gradingComponents.map((comp) => (
                            <th key={comp.name} className="py-2 px-2 font-medium text-center min-w-[90px]">
                              {comp.name}
                              <div className="text-[10px] opacity-60">/{comp.maxScore} ({comp.weight}%)</div>
                            </th>
                          ))}
                          <th className="py-2 pl-2 font-medium text-center min-w-[70px]">Total</th>
                          <th className="py-2 pl-2 font-medium text-center min-w-[50px]">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseStudents.map((student, idx) => {
                          const sid = String(student.id);
                          const total = getStudentTotal(sid);
                          const letter = total !== null ? getLetterGrade(total) : null;
                          const color = letter ? getGradeColor(letter) : '';

                          return (
                            <tr key={sid} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 pr-3">
                                <span className="text-xs text-muted-foreground mr-2">{idx + 1}.</span>
                                <span className="font-medium">{String(student.firstName)} {String(student.lastName)}</span>
                              </td>
                              {gradingComponents.map((comp) => {
                                const val = componentScores[sid]?.[comp.name] ?? '';
                                return (
                                  <td key={comp.name} className="py-2 px-2 text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={comp.maxScore}
                                      step={0.5}
                                      value={val}
                                      onChange={(e) => handleScoreChange(sid, comp.name, e.target.value)}
                                      className="w-20 h-8 text-sm text-center mx-auto"
                                      aria-label={`${comp.name} score for ${student.firstName}`}
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2 pl-2 text-center font-mono text-sm font-medium">
                                {total !== null ? total.toFixed(1) : '-'}
                              </td>
                              <td className="py-2 pl-2 text-center">
                                {letter && (
                                  <Badge variant="outline" className={`w-8 justify-center ${color}`}>{letter}</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Button className="w-full mt-4" onClick={handleSubmit} disabled={saving || createGrade.isPending}>
                    {saving || createGrade.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                    Save All Grades
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}