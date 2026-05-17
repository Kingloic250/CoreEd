import { useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCourses } from '@/hooks/useCourses';
import { useGetStudents } from '@/hooks/useStudents';
import { useCreateGrade } from '@/hooks/useGrades';
import { SEMESTERS, DEPARTMENTS } from '@/utils/constants';
import { getLetterGrade, getGradeColor } from '@/utils/formatters';

export function GradeInput() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});

  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const { data: students, isLoading: studentsLoading } = useGetStudents({});
  const createGrade = useCreateGrade();

  const courseList = (courses as Record<string, unknown>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];

  const selectedCourseData = courseList.find((c) => String(c.id) === selectedCourse);
  const courseStudentIds = (selectedCourseData?.studentIds as string[]) ?? [];
  const courseStudents = allStudents.filter((s) => courseStudentIds.includes(String(s.id)));

  const canShow = selectedCourse && selectedSemester && selectedSubject;

  const handleScoreChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,3}$/.test(value) && Number(value) <= 100)) {
      setScores((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSubmit = async () => {
    const toSave = courseStudents.filter((s) => scores[String(s.id)] !== undefined && scores[String(s.id)] !== '');
    if (toSave.length === 0) { toast.error('Enter at least one score'); return; }

    try {
      await Promise.all(
        toSave.map((s) => {
          const score = Number(scores[String(s.id)]);
          return createGrade.mutateAsync({
            studentId: String(s.id),
            courseId: selectedCourse,
            subject: selectedSubject,
            semester: selectedSemester,
            score,
            maxScore: 100,
            grade: getLetterGrade(Number(score)),
            comments: '',
          });
        })
      );
      toast.success(`Grades saved for ${toSave.length} student(s)`);
      setScores({});
    } catch {
      toast.error('Failed to save some grades');
    }
  };

  return (
    <div>
      <PageHeader title="Grade Input" description="Enter student scores by course and semester" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Course, Semester & Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Course</Label>
                {coursesLoading ? <Skeleton className="h-9" /> : (
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger aria-label="Select course"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courseList.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger aria-label="Select semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger aria-label="Select subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {canShow && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {String(selectedCourseData?.name)} — {selectedSubject} — {selectedSemester}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : courseStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students in this course.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {courseStudents.map((student, idx) => {
                      const sid = String(student.id);
                      const scoreVal = scores[sid] ?? '';
                      const numScore = scoreVal !== '' ? Number(scoreVal) : null;
                      const letter = numScore !== null ? getLetterGrade(numScore) : null;
                      const color = letter ? getGradeColor(letter) : '';
                      return (
                        <div
                          key={sid}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                        >
                          <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {String(student.firstName)} {String(student.lastName)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={scoreVal}
                              onChange={(e) => handleScoreChange(sid, e.target.value)}
                              placeholder="0–100"
                              className="w-20 h-8 text-sm text-center"
                              aria-label={`Score for ${student.firstName}`}
                            />
                            {letter && (
                              <Badge variant="outline" className={`w-8 justify-center ${color}`}>
                                {letter}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={handleSubmit}
                    disabled={createGrade.isPending}
                  >
                    {createGrade.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                    Save Grades
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
