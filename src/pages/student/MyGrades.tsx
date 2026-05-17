import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetGrades } from '@/hooks/useGrades';
import { useGetCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { getGradeColor } from '@/utils/formatters';
import { SEMESTERS } from '@/utils/constants';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

export function MyGrades() {
  const { user } = useAuth();
  const [activeSemester, setActiveSemester] = useState<string>(SEMESTERS[0]);
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const { data: grades, isLoading } = useGetGrades({ studentId: user?.id });
  const { data: courses } = useGetCourses();

  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const coursesList = (courses as Record<string, unknown>[]) ?? [];
  const semGrades = allGrades.filter((g) => g.semester === activeSemester);

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

  return (
    <div>
      <PageHeader title="My Grades" description="Academic performance by semester" />

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
                </div>

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
                              <Badge variant="outline" className={`shrink-0 ${getGradeColor(String(g.grade))}`}>
                                {String(g.grade)}
                              </Badge>
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
    </div>
  );
}