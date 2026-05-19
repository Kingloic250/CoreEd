import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as calendarApi from '@/api/calendarApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetCalendarEvents(params?: { type?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDAR_EVENTS, params],
    queryFn: () => calendarApi.getCalendarEvents(params),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] });
      toast.success('Event created');
    },
    onError: () => toast.error('Failed to create event'),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      calendarApi.updateCalendarEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] });
      toast.success('Event updated');
    },
    onError: () => toast.error('Failed to update event'),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] });
      toast.success('Event deleted');
    },
    onError: () => toast.error('Failed to delete event'),
  });
}
