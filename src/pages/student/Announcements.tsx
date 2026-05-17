// Student: filterable, expandable announcement cards
import { useState } from 'react';
import { format } from 'date-fns';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAnnouncements } from '@/hooks/useAnnouncements';

export function Announcements() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'normal'>('all');

  const { data: announcements, isLoading } = useGetAnnouncements();
  const list = (announcements as Record<string, unknown>[]) ?? [];

  const filtered = list.filter((a) => {
    const matchSearch =
      String(a.title).toLowerCase().includes(search.toLowerCase()) ||
      String(a.message).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.priority === filter;
    return matchSearch && matchFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <PageHeader title="Announcements" description="School-wide notices and updates" />

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            {(['all', 'high', 'normal'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === 'all' ? 'All' : f === 'high' ? 'Urgent' : 'Normal'}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No announcements found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const id = String(a.id);
              const isExpanded = expandedId === id;
              const isUrgent = a.priority === 'high';
              return (
                <Card key={id} className={isUrgent ? 'border-destructive/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUrgent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Bell className={`size-4 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold leading-snug">{String(a.title)}</p>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleExpand(id)}
                            className="shrink-0 -mt-1"
                          >
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(() => {
                            try { return format(new Date(String(a.createdAt)), 'MMM d, yyyy · h:mm a'); }
                            catch { return String(a.createdAt); }
                          })()}
                          {' · '}
                          By {String(a.createdBy)}
                        </p>

                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{String(a.message)}</p>
                        )}

                        {isExpanded && (
                          <p className="text-sm text-foreground mt-2 leading-relaxed whitespace-pre-wrap">{String(a.message)}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
