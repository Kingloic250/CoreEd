import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as messagesApi from '@/api/messagesApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetMessages(params: { userId?: string; folder?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, params],
    queryFn: () => messagesApi.getMessages(params),
    enabled: !!params.userId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES] });
      toast.success('Message sent successfully');
    },
    onError: () => toast.error('Failed to send message'),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => messagesApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES] });
    },
  });
}
