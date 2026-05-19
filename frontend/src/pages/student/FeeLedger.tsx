import { useState, useMemo } from 'react';
import { Wallet, Banknote, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink, Landmark, Smartphone, CreditCard, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetInvoices, useGetPayments } from '@/hooks/useFees';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  paid: { icon: CheckCircle2, label: 'Paid', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  overdue: { icon: AlertCircle, label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

const METHOD_ICONS: Record<string, typeof Landmark> = {
  bank_transfer: Landmark,
  mobile_money: Smartphone,
  credit_card: CreditCard,
  cash: Banknote,
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  credit_card: 'Credit Card',
  cash: 'Cash',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-RW', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' RWF';
}

export function FeeLedger() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const { data: invoices, isLoading } = useGetInvoices({ studentId: user?.id });
  const { data: payments } = useGetPayments({ studentId: user?.id });

  const invoicesList = (invoices as Record<string, unknown>[]) ?? [];
  const paymentsList = (payments as Record<string, unknown>[]) ?? [];

  const totalBilled = useMemo(
    () => invoicesList.reduce((s, inv) => s + Number(inv.totalAmount), 0),
    [invoicesList]
  );
  const totalPaid = useMemo(
    () => invoicesList.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + Number(inv.totalAmount), 0),
    [invoicesList]
  );
  const totalOutstanding = totalBilled - totalPaid;

  const paymentInvoiceMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    invoicesList.forEach((inv) => map.set(String(inv.id), inv));
    return map;
  }, [invoicesList]);

  const invoicePayments = useMemo(() => {
    const map = new Map<string, Record<string, unknown>[]>();
    paymentsList.forEach((pmt) => {
      const invId = String(pmt.invoiceId);
      if (!map.has(invId)) map.set(invId, []);
      map.get(invId)!.push(pmt);
    });
    return map;
  }, [paymentsList]);

  const filtered = activeTab === 'all'
    ? invoicesList
    : invoicesList.filter((inv) => inv.status === activeTab);

  const overdueCount = invoicesList.filter((inv) => inv.status === 'overdue').length;
  const pendingCount = invoicesList.filter((inv) => inv.status === 'pending').length;

  return (
    <div>
      <PageHeader title="Fee Ledger & Invoice History" description="View your tuition fees, invoices, and payment history" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Receipt className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(totalBilled)}</p>
                  <p className="text-xs text-muted-foreground">Total Billed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                  <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalOutstanding)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            {isLoading ? <Skeleton className="h-7 w-10" /> : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold">{overdueCount + pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending / Overdue</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Invoices</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="paid" className="text-xs px-3">Paid</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs px-3">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
              No invoices found.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((inv) => {
                const cfg = STATUS_CONFIG[String(inv.status)] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const isExpanded = expandedInvoice === String(inv.id);
                const invPmts = invoicePayments.get(String(inv.id)) ?? [];

                return (
                  <Card key={String(inv.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">
                              Invoice #{String(inv.id).toUpperCase()}
                            </h3>
                            <Badge className={cfg.className + ' text-xs gap-1'}>
                              <StatusIcon className="size-3" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {String(inv.semester)} &middot; {String(inv.academicYear)}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span>Due {formatDate(String(inv.dueDate))}</span>
                            <span>{String(inv.items?.length ?? 0)} items</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">{formatCurrency(Number(inv.totalAmount))}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1 mt-1"
                            onClick={() => setExpandedInvoice(isExpanded ? null : String(inv.id))}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t space-y-4">
                          {/* Line Items */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Line Items
                            </p>
                            <div className="space-y-1.5">
                              {(inv.items as Record<string, unknown>[] ?? []).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{String(item.description)}</span>
                                  <span className="font-medium">{formatCurrency(Number(item.amount))}</span>
                                </div>
                              ))}
                              <Separator />
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(Number(inv.totalAmount))}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payments */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Payment History
                            </p>
                            {invPmts.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No payments recorded yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {invPmts.map((pmt) => {
                                  const MethodIcon = METHOD_ICONS[String(pmt.method)] ?? Banknote;
                                  return (
                                    <div key={String(pmt.id)} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg p-2.5">
                                      <div className="flex items-center gap-2">
                                        <MethodIcon className="size-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{METHOD_LABELS[String(pmt.method)] ?? String(pmt.method)}</p>
                                          <p className="text-muted-foreground">
                                            Ref: {String(pmt.reference)} &middot; {formatDate(String(pmt.paidAt))}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(Number(pmt.amount))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="size-4" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No payments yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...paymentsList]
                    .sort((a, b) => new Date(String(b.paidAt)).getTime() - new Date(String(a.paidAt)).getTime())
                    .map((pmt) => {
                      const inv = paymentInvoiceMap.get(String(pmt.invoiceId));
                      const MethodIcon = METHOD_ICONS[String(pmt.method)] ?? Banknote;
                      return (
                        <div key={String(pmt.id)} className="flex items-start gap-3 text-xs">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <MethodIcon className="size-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{METHOD_LABELS[String(pmt.method)] ?? String(pmt.method)}</p>
                            <p className="text-muted-foreground">
                              {formatCurrency(Number(pmt.amount))}
                              {inv ? <span className="ml-1">&middot; {String(inv.semester)}</span> : null}
                            </p>
                            <p className="text-muted-foreground">{formatDate(String(pmt.paidAt))}</p>
                            {pmt.reference && (
                              <p className="text-muted-foreground/60 mt-0.5">Ref: {String(pmt.reference)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
