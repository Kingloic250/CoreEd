import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetAuditLogs } from '@/hooks/useAuditLogs';
import { formatDateTime } from '@/utils/formatters';

type AuditLog = Record<string, unknown>;

const actionConfig: Record<string, { label: string; color: string }> = {
  create_student: { label: 'Create Student', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_student: { label: 'Update Student', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete_student: { label: 'Delete Student', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  create_lecturer: { label: 'Create Lecturer', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_lecturer: { label: 'Update Lecturer', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete_lecturer: { label: 'Delete Lecturer', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  create_course: { label: 'Create Course', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_course: { label: 'Update Course', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete_course: { label: 'Delete Course', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  create_department: { label: 'Create Department', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_department: { label: 'Update Department', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete_department: { label: 'Delete Department', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  create_semester: { label: 'Create Semester', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  update_semester: { label: 'Update Semester', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete_semester: { label: 'Delete Semester', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  set_active_semester: { label: 'Set Active Semester', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  approve_request: { label: 'Approve Request', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  reject_request: { label: 'Reject Request', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  bulk_enroll: { label: 'Bulk Enroll', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

export function AuditLogs() {
  const { data, isLoading } = useGetAuditLogs();
  const logs = (data as AuditLog[]) ?? [];

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Date & Time',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">{formatDateTime(String(row.original.timestamp))}</span>
      ),
    },
    {
      accessorKey: 'performedBy',
      header: 'Admin',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = String(row.original.action);
        const config = actionConfig[action] ?? { label: action, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
        return <Badge variant="outline" className={`text-[11px] ${config.color}`}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'targetType',
      header: 'Target',
      cell: ({ row }) => (
        <span className="text-sm capitalize text-muted-foreground">
          {String(row.original.targetType).replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{String(row.original.details)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description={`${logs.length} logged actions`}
      />
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchPlaceholder="Search actions, admins, or targets..."
      />
    </div>
  );
}
