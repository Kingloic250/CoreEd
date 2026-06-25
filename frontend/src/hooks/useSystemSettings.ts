import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as systemSettingsApi from '@/api/systemSettingsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_SETTINGS],
    queryFn: () => systemSettingsApi.getSettings(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => systemSettingsApi.updateSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SYSTEM_SETTINGS] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });
}
