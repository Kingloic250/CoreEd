import { useQuery } from '@tanstack/react-query';
import { getAllAuditLogs } from '@/api/auditLogsApi';
import { QUERY_KEYS } from '@/utils/constants';

export function useGetAuditLogs() {
  return useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS],
    queryFn: getAllAuditLogs,
  });
}
