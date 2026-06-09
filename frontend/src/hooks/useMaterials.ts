import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as materialsApi from '@/api/materialsApi';
import { QUERY_KEYS } from '@/utils/constants';
import { toast } from 'sonner';

export function useGetMaterials(params?: { courseId?: string; type?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIALS, params],
    queryFn: () => materialsApi.getMaterials(params),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => materialsApi.createMaterial(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      toast.success('Material added');
    },
    onError: () => toast.error('Failed to add material'),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialsApi.deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      toast.success('Material deleted');
    },
    onError: () => toast.error('Failed to delete material'),
  });
}
