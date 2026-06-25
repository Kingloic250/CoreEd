import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, BarChart3, GraduationCap, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetGrades, useGetStudentStanding } from '@/hooks/useGrades';
import { useGetCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useGetClaims, useCreateClaim } from '@/hooks/useClaims';
import { getGradeColor } from '@/utils/formatters';
import { SEMESTERS, GRADE_SCALE } from '@/utils/constants';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, XAxis, YAxis, CartesianGrid, Bar, Cell,
} from 'recharts';

const DIST_COLORS: Record<string, string> = {
  A: '#10b981', B: '#3b82f6', C: '#eab308', D: '#f97316', F: '#ef4444',
};

export function MyGrades() {
  const { user } = useAuth();
  const [activeSemester, setActiveSemester] = useState<string>(SEMESTERS[0]);
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const { data: grades, isLoading } = useGetGrades({ studentId: user?.id });
  const { data: courses } = useGetCourses();
  const { data: standing } = useGetStudentStanding(user?.id ?? '');

  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const semGrades = allGrades.filter((g) => g.semester === activeSemester);

  const { data: claims } = useGetClaims(user?.id);
  const { mutate: createClaim } = useCreateClaim();
  const claimsList = (claims as Record<string, unknown>[]) ?? [];
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimGrade, setClaimGrade] = useState<Record<string, unknown> | null>(null);
  const [claimReason, setClaimReason] = useState('');

  const claimMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    claimsList.forEach((c) => map.set(String(c.gradeId), c));
    return map;
  }, [claimsList]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    coursesList.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [coursesList]);

  const avgScore = semGrades.length > 0
    ? Math.round(semGrades.reduce((s, g) => s + Number(g.score), 0) / semGrades.length)
    : 0;

  const radarData = semGrades.map((g) => ({
    subject: String(g.subject).length > 8 ? String(g.subject).slice(0, 8) + '\u2026' : String(g.subject),
    score: Number(g.score),
  }));

  const cumulativeGpa = standing?.cumulativeGpa ?? 0;

  const totalUniqueCourses = useMemo(
    () => new Set(allGrades.map((g) => String(g.courseId))).size,
    [allGrades]
  );

  const letterDist = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    semGrades.forEach((g) => {
      const letter = String(g.grade ?? 'F');
      if (letter in counts) counts[letter]++;
    });
    return GRADE_SCALE.map((s) => ({
      letter: s.letter,
      count: counts[s.letter],
    }));
  }, [semGrades]);

  function handleClaimClick(g: Record<string, unknown>) {
    setClaimGrade(g);
    setClaimReason('');
    setClaimDialogOpen(true);
  }

  function handleClaimSubmit() {
    if (!claimGrade || !claimReason.trim()) return;
    createClaim({
      gradeId: claimGrade.id,
      studentId: user?.id,
      subject: claimGrade.subject,
      semester: claimGrade.semester,
      claimedGrade: claimGrade.grade,
      reason: claimReason.trim(),
    });
    setClaimDialogOpen(false);
    setClaimGrade(null);
    setClaimReason('');
  }

  const CLAIM_STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; className: string }> = {
    pending: { icon: Clock, label: 'Claimed', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    approved: { icon: CheckCircle2, label: 'Claim Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    rejected: { icon: AlertCircle, label: 'Claim Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  };

  return (
    <div>
      <PageHeader title="My Grades" description="Academic performance by semester" />

      {/* Cumulative GPA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-16" /> : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{cumulativeGpa.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Cumulative GPA</p>
                  {standing && (
                    <Badge variant="outline" className={`mt-1 text-xs ${
                      standing.academicStanding === 'good standing' ? 'text-emerald-600 border-emerald-300' :
                      standing.academicStanding === 'probation' ? 'text-amber-600 border-amber-300' :
                      'text-destructive border-destructive/50'
                    }`}>
                      {standing.academicStanding}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <p className="text-xl font-bold">{totalUniqueCourses}</p>
                <p className="text-xs text-muted-foreground">Courses Taken</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <p className="text-xl font-bold">{allGrades.length}</p>
                <p className="text-xs text-muted-foreground">Total Grades</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <p className="text-xl font-bold">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Semester Avg</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSemester} onValueChange={setActiveSemester}>
        <TabsList className="mb-6">
          {SEMESTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>

        {SEMESTERS.map((sem) => (
          <TabsContent key={sem} value={sem}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : semGrades.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No grades recorded for {sem}.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{semGrades.length} subjects</span>
                  <span className="text-muted-foreground">Average: <span className="font-semibold text-foreground">{avgScore}%</span></span>
                  <span className="text-muted-foreground">GPA: <span className="font-semibold text-foreground">{(standing?.semesterGpas?.[activeSemester] ?? cumulativeGpa).toFixed(2)}</span></span>
                </div>

                {/* Letter Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Grade Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {letterDist.some((d) => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={letterDist} barSize={48}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="letter" tick={{ fontSize: 13, fontWeight: 600, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }}
                            itemStyle={{ color: 'var(--popover-foreground)' }}
                          />
                          <Bar dataKey="count" name="Courses" radius={[4, 4, 0, 0]}>
                            {letterDist.map((entry) => (
                              <Cell key={entry.letter} fill={DIST_COLORS[entry.letter] ?? 'var(--primary)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No grades to display distribution.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {semGrades.map((g) => {
                      const pct = Math.round((Number(g.score) / Number(g.maxScore)) * 100);
                      const course = courseMap.get(String(g.courseId));
                      const components = (course?.gradingComponents as Record<string, unknown>[]) ?? [];
                      const componentScores = g.componentScores as Record<string, number> | undefined;
                      const hasBreakdown = components.length > 0 && componentScores && Object.keys(componentScores).length > 0;
                      const isExpanded = expandedGrade === String(g.id);

                      return (
                        <Card key={String(g.id)} className="flex flex-col">
                          <CardHeader
                            className={`pb-2 ${hasBreakdown ? 'cursor-pointer select-none' : ''}`}
                            onClick={() => hasBreakdown && setExpandedGrade(isExpanded ? null : String(g.id))}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <CardTitle className="text-sm leading-snug">{String(g.subject)}</CardTitle>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {(() => {
                                  const claim = claimMap.get(String(g.id));
                                  if (claim) {
                                    const cfg = CLAIM_STATUS_CONFIG[String(claim.status)] ?? CLAIM_STATUS_CONFIG.pending;
                                    const Icon = cfg.icon;
                                    return <Badge className={cfg.className + ' text-xs gap-1'}><Icon className="size-3" />{cfg.label}</Badge>;
                                  }
                                  return null;
                                })()}
                                <Badge variant="outline" className={`shrink-0 ${getGradeColor(String(g.grade))}`}>
                                  {String(g.grade)}
                                </Badge>
                                {!claimMap.has(String(g.id)) && (
                                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); handleClaimClick(g); }}>
                                    Claim
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-2xl font-bold">{String(g.score)}<span className="text-sm text-muted-foreground font-normal">/{String(g.maxScore)}</span></p>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{pct}%</p>

                            {hasBreakdown && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-3 w-full gap-1 text-xs h-7"
                                onClick={() => setExpandedGrade(isExpanded ? null : String(g.id))}
                              >
                                <BarChart3 className="size-3" />
                                {isExpanded ? 'Hide Breakdown' : 'View Breakdown'}
                                {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                              </Button>
                            )}

                            {isExpanded && hasBreakdown && (
                              <div className="mt-3 pt-3 border-t space-y-2.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Component Scores
                                </p>
                                {components.map((comp) => {
                                  const compName = String(comp.name);
                                  const maxScore = Number(comp.maxScore);
                                  const weight = Number(comp.weight);
                                  const earned = componentScores![compName] ?? 0;
                                  const compPct = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
                                  return (
                                    <div key={compName}>
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{compName}</span>
                                        <span className="font-medium">
                                          {earned}/{maxScore}
                                          <span className="text-muted-foreground ml-1">({compPct}%)</span>
                                          <span className="text-muted-foreground ml-1.5">w{weight}%</span>
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            compPct >= 80 ? 'bg-green-500' : compPct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${compPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                                {!!g.comments && (
                                  <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">
                                    &ldquo;{String(g.comments)}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}

                            {!hasBreakdown && !!g.comments && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">{String(g.comments)}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {radarData.length >= 3 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Performance Radar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            />
                            <Radar
                              name="Score"
                              dataKey="score"
                              stroke="var(--primary)"
                              fill="var(--primary)"
                              fillOpacity={0.2}
                            />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--popover)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--popover-foreground)',
                              }}
                              itemStyle={{ color: 'var(--popover-foreground)' }}
                              labelStyle={{ color: 'var(--popover-foreground)' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Marks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Course:</span> {String(claimGrade?.subject ?? '')}</p>
              <p><span className="font-medium text-foreground">Semester:</span> {String(claimGrade?.semester ?? '')}</p>
              <p><span className="font-medium text-foreground">Current Grade:</span> {String(claimGrade?.grade ?? '')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for claim</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you believe the grade should be reviewed..."
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClaimSubmit} disabled={!claimReason.trim()}>Submit Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}