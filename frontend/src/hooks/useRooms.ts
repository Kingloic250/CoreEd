import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as roomsApi from '@/api/roomsApi';
import { toast } from 'sonner';

export const ROOMS_KEY = 'rooms';

export function useGetRooms() {
  return useQuery({
    queryKey: [ROOMS_KEY],
    queryFn: roomsApi.getRooms,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.createRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      toast.success('Room created successfully');
    },
    onError: () => toast.error('Failed to create room'),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      roomsApi.updateRoom(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      toast.success('Room updated successfully');
    },
    onError: () => toast.error('Failed to update room'),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.deleteRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
      toast.success('Room deleted successfully');
    },
    onError: () => toast.error('Failed to delete room'),
  });
}