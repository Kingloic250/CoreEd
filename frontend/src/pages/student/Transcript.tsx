import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, GraduationCap, Award, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetTranscript } from '@/hooks/useGrades';
import { useGetAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { getGradeColor } from '@/utils/formatters';
import { SEMESTERS } from '@/utils/constants';
import { downloadTranscriptPdf } from '@/api/gradesApi';

const STANDING_CONFIG = {
  'good standing': { icon: GraduationCap, className: 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' },
  probation: { icon: AlertTriangle, className: 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30' },
  suspension: { icon: Award, className: 'text-destructive border-destructive/50 bg-destructive/5' },
};

export function Transcript() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { data: transcript, isLoading: gradesLoading } = useGetTranscript(user?.id ?? '');
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendance({ studentId: user?.id });

  const allGrades = (transcript?.grades ?? []) as Record<string, unknown>[];
  const attendanceList = (attendance as Record<string, unknown>[]) ?? [];

  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const attendancePct = attendanceList.length > 0 ? Math.round((presentCount / attendanceList.length) * 100) : 0;

  const gradesBySemester = SEMESTERS.reduce<Record<string, Record<string, unknown>[]>>((acc, sem) => {
    acc[sem] = allGrades.filter((g) => g.semester === sem);
    return acc;
  }, {});

  const standingCfg = STANDING_CONFIG[transcript?.academicStanding ?? 'good standing'] ?? STANDING_CONFIG['good standing'];
  const StandingIcon = standingCfg.icon;
  const handleDownloadPdf = async () => {
    if (!user?.id) return;
    setPdfLoading(true);
    try {
      const blob = await downloadTranscriptPdf(user.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${user.id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* noop */ } finally {
      setPdfLoading(false);
    }
  };

  const isLoading = gradesLoading || attendanceLoading;

  return (
    <div>
      <PageHeader title="Transcript" description="Official academic record" />

      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handleDownloadPdf} variant="outline" disabled={pdfLoading}>
          {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </div>

      <div ref={printRef} className="print:p-8">
        <style>{`
          @media print {
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .print\\:p-8 { padding: 2rem !important; }
          }
        `}</style>

        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-8">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Official Academic Transcript</p>
                  <Separator className="mt-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Student Name: </span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Issued: </span>
                    <span className="font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attendance Rate: </span>
                    <span className={`font-medium ${attendancePct >= 80 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {attendancePct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cumulative GPA: </span>
                    <span className="font-semibold">{transcript?.cumulativeGpa.toFixed(2) ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Academic Standing: </span>
                    <Badge variant="outline" className={`text-xs gap-1 ${standingCfg.className}`}>
                      <StandingIcon className="size-3" />
                      {transcript?.academicStanding ?? 'good standing'}
                    </Badge>
                  </div>
                </div>

                <Separator className="mb-6" />

                {SEMESTERS.map((sem) => {
                  const semGrades = gradesBySemester[sem] ?? [];
                  if (semGrades.length === 0) return null;
                  const semGpa = transcript?.semesterGpas?.[sem] ?? 0;
                  return (
                    <div key={sem} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{sem}</h2>
                        <span className="text-xs text-muted-foreground">
                          GPA: <strong className="text-foreground">{semGpa.toFixed(2)}</strong>
                        </span>
                      </div>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Subject</th>
                              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Score</th>
                              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Max</th>
                              <th className="text-center px-4 py-2 font-medium text-muted-foreground">%</th>
                              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semGrades.map((g) => {
                              const pct = Math.round((Number(g.score) / Number(g.maxScore)) * 100);
                              return (
                                <tr key={String(g.id)} className="border-t hover:bg-muted/20">
                                  <td className="px-4 py-2">{String(g.subject)}</td>
                                  <td className="px-4 py-2 text-center">{String(g.score)}</td>
                                  <td className="px-4 py-2 text-center">{String(g.maxScore)}</td>
                                  <td className="px-4 py-2 text-center">{pct}%</td>
                                  <td className="px-4 py-2 text-center">
                                    <Badge variant="outline" className={`text-xs ${getGradeColor(String(g.grade))}`}>
                                      {String(g.grade)}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                <Separator className="my-6" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cumulative GPA</span>
                    <p className="text-lg font-bold">{transcript?.cumulativeGpa.toFixed(2) ?? 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Credits</span>
                    <p className="text-lg font-bold">{transcript?.totalCredits ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grade Points</span>
                    <p className="text-lg font-bold">{transcript?.totalGradePoints ?? '0.0'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Standing</span>
                    <p className={`text-lg font-bold ${
                      transcript?.academicStanding === 'good standing' ? 'text-emerald-600' :
                      transcript?.academicStanding === 'probation' ? 'text-amber-600' : 'text-destructive'
                    }`}>
                      {transcript?.academicStanding ?? 'good standing'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-8 text-center">
                  This is an official document generated by {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'} on {format(new Date(), 'MMMM d, yyyy')}.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
