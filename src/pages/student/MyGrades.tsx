// Student: grades by term with subject cards and radar chart
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetGrades } from '@/hooks/useGrades';
import { useAuth } from '@/hooks/useAuth';
import { getGradeColor } from '@/utils/formatters';
import { TERMS } from '@/utils/constants';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

export function MyGrades() {
  const { user } = useAuth();
  const [activeTerm, setActiveTerm] = useState<string>(TERMS[0]);
  const { data: grades, isLoading } = useGetGrades({ studentId: user?.id });

  const allGrades = (grades as Record<string, unknown>[]) ?? [];
  const termGrades = allGrades.filter((g) => g.term === activeTerm);

  const avgScore = termGrades.length > 0
    ? Math.round(termGrades.reduce((s, g) => s + Number(g.score), 0) / termGrades.length)
    : 0;

  const radarData = termGrades.map((g) => ({
    subject: String(g.subject).length > 8 ? String(g.subject).slice(0, 8) + '…' : String(g.subject),
    score: Number(g.score),
  }));

  return (
    <div>
      <PageHeader title="My Grades" description="Academic performance by term" />

      <Tabs value={activeTerm} onValueChange={setActiveTerm}>
        <TabsList className="mb-6">
          {TERMS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>

        {TERMS.map((term) => (
          <TabsContent key={term} value={term}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : termGrades.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No grades recorded for {term}.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{termGrades.length} subjects</span>
                  <span className="text-muted-foreground">Average: <span className="font-semibold text-foreground">{avgScore}%</span></span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grade cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {termGrades.map((g) => {
                      const pct = Math.round((Number(g.score) / Number(g.maxScore)) * 100);
                      return (
                        <Card key={String(g.id)}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-1">
                              <CardTitle className="text-sm leading-snug">{String(g.subject)}</CardTitle>
                              <Badge variant="outline" className={`shrink-0 ${getGradeColor(String(g.grade))}`}>
                                {String(g.grade)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">{String(g.score)}<span className="text-sm text-muted-foreground font-normal">/{String(g.maxScore)}</span></p>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                            {!!g.comments && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">{String(g.comments)}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Radar chart */}
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
                              }}
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
