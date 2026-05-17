// Student: print-ready official transcript
import { useRef } from 'react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { getGradeColor } from '@/utils/formatters';
import { TERMS } from '@/utils/constants';

export function Transcript() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: grades, isLoading: gradesLoading } = useGetGrades({ studentId: user?.id });
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendance({ studentId: user?.id });

  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const attendanceList = (attendance as Record<string, unknown>[]) ?? [];

  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const attendancePct = attendanceList.length > 0 ? Math.round((presentCount / attendanceList.length) * 100) : 0;
  const overallAvg = allGrades.length > 0
    ? Math.round(allGrades.reduce((s, g) => s + Number(g.score), 0) / allGrades.length)
    : 0;

  const gradesByTerm = TERMS.reduce<Record<string, Record<string, unknown>[]>>((acc, term) => {
    acc[term] = allGrades.filter((g) => g.term === term);
    return acc;
  }, {});

  const handlePrint = () => window.print();

  const isLoading = gradesLoading || attendanceLoading;

  return (
    <div>
      <PageHeader title="Transcript" description="Official academic record" />

      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="size-4" /> Print Transcript
        </Button>
      </div>

      {/* Print area */}
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
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Official Academic Transcript</p>
                  <Separator className="mt-4" />
                </div>

                {/* Student info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
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
                </div>

                <Separator className="mb-6" />

                {/* Grades by term */}
                {TERMS.map((term) => {
                  const termGrades = gradesByTerm[term] ?? [];
                  if (termGrades.length === 0) return null;
                  const termAvg = Math.round(termGrades.reduce((s, g) => s + Number(g.score), 0) / termGrades.length);
                  return (
                    <div key={term} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{term}</h2>
                        <span className="text-xs text-muted-foreground">Average: <strong className="text-foreground">{termAvg}%</strong></span>
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
                            {termGrades.map((g) => {
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

                {/* Overall summary */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Overall Average</span>
                  <span className="text-lg font-bold">{overallAvg}%</span>
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
