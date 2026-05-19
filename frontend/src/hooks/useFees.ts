import { useQuery } from '@tanstack/react-query';
import * as feesApi from '@/api/feesApi';
import { QUERY_KEYS } from '@/utils/constants';

export function useGetInvoices(params: { studentId?: string; status?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, params],
    queryFn: () => feesApi.getInvoices(params),
    enabled: !!params.studentId,
  });
}

export function useGetPayments(params: { studentId?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, params],
    queryFn: () => feesApi.getPayments(params),
    enabled: !!params.studentId,
  });
}
