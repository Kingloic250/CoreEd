import { useState, useCallback } from 'react';
import { Check, X, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAccountRequests, useApproveRequest, useRejectRequest } from '@/hooks/useAccountRequests';
import { formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import type { AccountRequest } from '@/api/accountRequestApi';

export function AccountRequests() {
  const { data, isLoading } = useAccountRequests();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const [approving, setApproving] = useState<AccountRequest | null>(null);
  const [approvedResult, setApprovedResult] = useState<string | null>(null);

  const requests = (data as AccountRequest[]) ?? [];

  const handleApprove = useCallback(() => {
    if (!approving) return;
    approveMutation.mutate(approving.id, {
      onSuccess: (res: unknown) => {
        const r = res as Record<string, unknown>;
        setApprovedResult(String(r.tempPassword ?? ''));
      },
    });
  }, [approving, approveMutation]);

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Student ID',
      accessorKey: 'studentId',
      cell: ({ row }: { row: { original: AccountRequest } }) => (
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="size-3 text-muted-foreground" />
          {row.original.studentId || '—'}
        </span>
      ),
    },
    {
      header: 'Flag',
      accessorKey: 'flagged',
      cell: ({ row }: { row: { original: AccountRequest } }) => {
        if (!row.original.flagged) return null;
        return (
          <Badge variant="outline" className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="size-3" />
            Suspicious
          </Badge>
        );
      },
    },
    {
      header: 'Class/Grade',
      accessorKey: 'classOrSubject',
    },
    {
      header: 'Message',
      accessorKey: 'message',
      cell: ({ row }: { row: { original: AccountRequest } }) => (
        <span className="max-w-[120px] sm:max-w-[200px] truncate block">{row.original.message || '—'}</span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: ({ row }: { row: { original: AccountRequest } }) => formatDate(row.original.createdAt),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: { original: AccountRequest } }) => {
        const status = row.original.status;
        const map: Record<string, { label: string; icon: typeof Clock; color: string }> = {
          pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
          approved: { label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
          rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
        };
        const { label, icon: Icon, color } = map[status] ?? map.pending;
        return (
          <Badge variant="outline" className={`gap-1 ${color}`}>
            <Icon className="size-3" />
            {label}
          </Badge>
        );
      },
    },
    {
      header: 'School Email',
      accessorKey: 'schoolEmail',
      cell: ({ row }: { row: { original: AccountRequest } }) => row.original.schoolEmail || '—',
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: AccountRequest } }) => {
        const r = row.original;
        if (r.status !== 'pending') return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setApproving(r);
                setSchoolEmail('');
                setPassword('');
              }}
            >
              <Check className="size-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rejectMutation.mutate(r.id)}
              disabled={rejectMutation.isPending}
            >
              <X className="size-3 mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Account Requests"
        description="Review and approve student account requests"
      />

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        searchPlaceholder="Search by name or email..."
      />

      <Dialog open={!!approving} onOpenChange={(open) => { if (!open) { setApproving(null); setApprovedResult(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Account Request</DialogTitle>
            <DialogDescription>
              Create an account for <strong>{approving?.name}</strong> using their email <strong>{approving?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          {approving?.flagged && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>This request is flagged — the student ID <strong>{approving.studentId}</strong> was not found in the system. You should reject this request.</span>
            </div>
          )}

          {approvedResult ? (
            <div className="space-y-3 py-2">
              <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-700 dark:text-green-400">
                Account approved. Share this temporary password with the student:
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <code className="flex-1 text-sm font-mono font-bold">{approvedResult}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(approvedResult);
                    toast.success('Password copied');
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The student should sign in with their email and change this password.
              </p>
            </div>
          ) : (
            <div className="py-2 text-sm text-muted-foreground">
              An account will be created with a randomly generated password. The student can use the forgot-password flow to set their own password.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproving(null); setApprovedResult(null); }}>
              {approvedResult ? 'Close' : 'Cancel'}
            </Button>
            {!approvedResult && (
              <Button onClick={handleApprove} disabled={approving?.flagged || approveMutation.isPending}>
                {approveMutation.isPending ? 'Approving...' : 'Approve & Create Account'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
