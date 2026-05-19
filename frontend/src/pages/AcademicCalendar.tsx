import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, subMonths, addMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetCalendarEvents } from '@/hooks/useCalendar';
import { formatDate } from '@/utils/formatters';

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  type: 'exam' | 'deadline' | 'holiday' | 'event';
  date: string;
  time: string | null;
  endTime: string | null;
  courseId: string | null;
  courseName: string | null;
};

const EVENT_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  exam: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', label: 'Exam' },
  deadline: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', label: 'Deadline' },
  holiday: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', label: 'Holiday' },
  event: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', label: 'Event' },
};

const TYPE_OPTIONS = [
  { key: '', label: 'All', color: '' },
  { key: 'exam', label: 'Exams', color: 'bg-red-500' },
  { key: 'deadline', label: 'Deadlines', color: 'bg-amber-500' },
  { key: 'holiday', label: 'Holidays', color: 'bg-emerald-500' },
  { key: 'event', label: 'Events', color: 'bg-blue-500' },
] as const;

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AcademicCalendarProps {
  role: string;
}

export function AcademicCalendar({ role }: AcademicCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: events, isLoading } = useGetCalendarEvents();

  const allEvents = (events as CalendarEvent[]) ?? [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  const filteredEvents = useMemo(() => {
    let result = allEvents;
    if (typeFilter) result = result.filter((e) => e.type === typeFilter);
    if (role) result = result.filter((e) => (e as Record<string, unknown>).targetRoles?.includes(role));
    return result;
  }, [allEvents, typeFilter, role]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((e) => {
      try { return isSameDay(new Date(e.date), day); } catch { return false; }
    });
  };

  const monthEvents = useMemo(
    () => filteredEvents.filter((e) => {
      try {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      } catch { return false; }
    }),
    [filteredEvents, monthStart, monthEnd]
  );

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : monthEvents.slice(0, 8);

  return (
    <div>
      <PageHeader title="Academic Calendar" description="Upcoming exams, deadlines, holidays, and events" />

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            variant={typeFilter === opt.key ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setTypeFilter(opt.key)}
          >
            {opt.color && <span className={`size-2 rounded-full ${opt.color}`} />}
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56" />
              ) : (
                <>
                  <div className="grid grid-cols-7 mb-2">
                    {WEEK_DAYS.map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDow }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {days.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const isToday = isSameDay(day, new Date());
                      const isSelected = selectedDay && isSameDay(day, selectedDay);
                      const uniqueTypes = [...new Set(dayEvents.map((e) => e.type))];

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                          className={`relative flex flex-col items-center justify-center rounded-md text-xs p-1 min-h-[48px] transition-colors
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                            ${isToday && !isSelected ? 'border-2 border-primary/40' : ''}
                            hover:bg-accent cursor-pointer
                          `}
                        >
                          <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {format(day, 'd')}
                          </span>
                          {uniqueTypes.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {uniqueTypes.slice(0, 3).map((t) => (
                                <span key={t} className={`size-1.5 rounded-full ${EVENT_STYLES[t]?.dot ?? 'bg-muted'}`} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                    {Object.entries(EVENT_STYLES).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`size-2.5 rounded-full ${val.dot}`} />
                        {val.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events list */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'Upcoming Events'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events on this day.</p>
              ) : (
                <div className="space-y-3">
                  {(selectedDay ? selectedEvents : selectedEvents).slice(0, 10).map((e) => {
                    const style = EVENT_STYLES[e.type] ?? EVENT_STYLES.event;
                    return (
                      <div key={e.id} className="rounded-lg border p-3 text-sm space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${style.badge}`}>
                            {style.label}
                          </span>
                          {e.courseName && (
                            <span className="text-xs text-muted-foreground shrink-0">{e.courseName}</span>
                          )}
                        </div>
                        <p className="font-medium text-sm leading-snug">{e.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(e.date)}</span>
                          {e.time && <span>· {e.time}{e.endTime ? `–${e.endTime}` : ''}</span>}
                        </div>
                        {e.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
