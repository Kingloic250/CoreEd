import { useQuery } from '@tanstack/react-query';
import * as materialsApi from '@/api/materialsApi';
import { QUERY_KEYS } from '@/utils/constants';

export function useGetMaterials(params?: { courseId?: string; type?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIALS, params],
    queryFn: () => materialsApi.getMaterials(params),
  });
}
