import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, GraduationCap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetClaims } from '@/hooks/useClaims';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  rejected: { icon: AlertCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

export function GradeClaims() {
  const { user } = useAuth();
  const { data: claims, isLoading } = useGetClaims(user?.id);
  const [filter, setFilter] = useState('all');

  const claimsList = (claims as Record<string, unknown>[]) ?? [];

  const filtered = filter === 'all' ? claimsList : claimsList.filter((c) => c.status === filter);

  return (
    <div>
      <PageHeader
        title="Grade Claims"
        description="Track and manage your grade appeals"
      />

      {claimsList.length === 0 && !isLoading && (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <MessageSquare className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No grade claims yet</p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              If you believe a grade is incorrect, you can file a claim from your grades page.
            </p>
            <Button variant="outline" asChild>
              <Link to="/student/grades">
                <GraduationCap className="size-3 mr-1" />
                Go to My Grades
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {claimsList.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            {['all', 'pending', 'approved', 'rejected'].map((t) => {
              const cfg = STATUS_CONFIG[t];
              const count = t === 'all' ? claimsList.length : claimsList.filter((c) => c.status === t).length;
              return (
                <Button
                  key={t}
                  variant={filter === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(t)}
                  className="gap-1.5 capitalize"
                >
                  {cfg && <cfg.icon className="size-3.5" />}
                  {t === 'all' ? 'All' : cfg?.label ?? t}
                  <Badge variant="secondary" className="ml-0.5 text-xs px-1 py-0">{count}</Badge>
                </Button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No {filter} claims.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => {
                const cfg = STATUS_CONFIG[String(c.status)] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <Card key={String(c.id)} className="hover:bg-accent/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{String(c.subject)}</h3>
                            <Badge className={cfg.className + ' text-xs gap-1'}>
                              <Icon className="size-3" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{String(c.reason)}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Filed {formatDate(String(c.createdAt))}</span>
                            {c.semester && <span>{String(c.semester)}</span>}
                            {c.claimedGrade && <span>Claimed: {String(c.claimedGrade)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {c.resolvedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              Resolved {formatDate(String(c.resolvedAt))}
                            </span>
                          )}
                        </div>
                      </div>
                      {c.resolutionNote && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Resolution: </span>
                          {String(c.resolutionNote)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
