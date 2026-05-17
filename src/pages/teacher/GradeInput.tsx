// Teacher: enter grades for students in a class by term
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
import { useGetClasses } from '@/hooks/useClasses';
import { useGetStudents } from '@/hooks/useStudents';
import { useCreateGrade } from '@/hooks/useGrades';
import { TERMS, SUBJECTS } from '@/utils/constants';
import { getLetterGrade, getGradeColor } from '@/utils/formatters';

export function GradeInput() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});

  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: students, isLoading: studentsLoading } = useGetStudents({});
  const createGrade = useCreateGrade();

  const classList = (classes as Record<string, unknown>[]) ?? [];
  const allStudents = (students as Record<string, unknown>[]) ?? [];

  const selectedClassData = classList.find((c) => String(c.id) === selectedClass);
  const classStudentIds = (selectedClassData?.studentIds as string[]) ?? [];
  const classStudents = allStudents.filter((s) => classStudentIds.includes(String(s.id)));

  const canShow = selectedClass && selectedTerm && selectedSubject;

  const handleScoreChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,3}$/.test(value) && Number(value) <= 100)) {
      setScores((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSubmit = async () => {
    const toSave = classStudents.filter((s) => scores[String(s.id)] !== undefined && scores[String(s.id)] !== '');
    if (toSave.length === 0) { toast.error('Enter at least one score'); return; }

    try {
      await Promise.all(
        toSave.map((s) => {
          const score = Number(scores[String(s.id)]);
          return createGrade.mutateAsync({
            studentId: String(s.id),
            classId: selectedClass,
            subject: selectedSubject,
            term: selectedTerm,
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
      <PageHeader title="Grade Input" description="Enter student scores by class and term" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Class, Term & Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Class</Label>
                {classesLoading ? <Skeleton className="h-9" /> : (
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger aria-label="Select class"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classList.map((cls) => (
                        <SelectItem key={String(cls.id)} value={String(cls.id)}>{String(cls.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger aria-label="Select term"><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger aria-label="Select subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                {String(selectedClassData?.name)} — {selectedSubject} — {selectedTerm}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : classStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students in this class.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {classStudents.map((student, idx) => {
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
