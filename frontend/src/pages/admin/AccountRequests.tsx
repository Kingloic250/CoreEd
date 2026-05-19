import { useState } from 'react';
import { Check, X, Mail, Key, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAccountRequests, useApproveRequest, useRejectRequest } from '@/hooks/useAccountRequests';
import { formatDate } from '@/utils/formatters';
import type { AccountRequest } from '@/api/accountRequestApi';

export function AccountRequests() {
  const { data, isLoading } = useAccountRequests();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const [approving, setApproving] = useState<AccountRequest | null>(null);
  const [schoolEmail, setSchoolEmail] = useState('');
  const [password, setPassword] = useState('');

  const requests = (data as AccountRequest[]) ?? [];

  const handleApprove = () => {
    if (!approving || !schoolEmail || !password) return;
    approveMutation.mutate(
      { id: approving.id, schoolEmail, password },
      { onSuccess: () => setApproving(null) }
    );
  };

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

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Account Request</DialogTitle>
            <DialogDescription>
              Assign a school email and password for <strong>{approving?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {approving?.flagged && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>This request is flagged — the student ID <strong>{approving.studentId}</strong> was not found in the system. You should reject this request.</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="schoolEmail">University Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="schoolEmail"
                  className="pl-10"
                  placeholder="e.g. student@greenfield.edu"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvePassword">Password</Label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="approvePassword"
                  type="password"
                  className="pl-10"
                  placeholder="Set a temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={!schoolEmail || !password || approving?.flagged || approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Approve & Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
