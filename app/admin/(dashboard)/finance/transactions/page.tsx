"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { FinanceNav } from "@/components/admin/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TransactionItem {
  id: string;
  type: string;
  amount: number | string;
  status: string;
  providerReference: string | null;
  createdAt: string;
  payment: {
    id: string;
    provider: string;
    booking: {
      bookingReference: string;
      customer: { firstName: string; lastName: string };
    } | null;
  };
}

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/finance/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const json = await res.json();
      setTransactions(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CHARGE":
        return <Badge variant="default">Charge</Badge>;
      case "REFUND":
        return <Badge variant="secondary">Refund</Badge>;
      case "SECURITY_HOLD":
        return <Badge variant="outline">Security Hold</Badge>;
      case "RELEASE":
        return <Badge variant="outline">Deposit Release</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "REFUNDED":
        return <Badge variant="info">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor transactions, customer invoices, revenue settlements, and tax compliance.
        </p>
      </div>

      <FinanceNav />

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Logged Events
            </CardTitle>
            <Activity className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Audit ledger entries</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Gateway Events
            </CardTitle>
            <TrendingUp className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Synchronized with providers</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Security Deposit Holds
            </CardTitle>
            <ShieldCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pre-auth</div>
            <p className="text-xs text-muted-foreground mt-1">Protected against damages</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Ledger Integrity
            </CardTitle>
            <Receipt className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Immutable</div>
            <p className="text-xs text-muted-foreground mt-1">Double-entry verified</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Financial Ledger & Events</CardTitle>
            <CardDescription>
              Low-level charge events, gateway references, authorizations, and refunds.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search reference, booking..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading transaction ledger...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions recorded in the ledger yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.id.slice(0, 10)}...
                      </TableCell>
                      <TableCell>{getTypeBadge(t.type)}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {t.payment?.booking?.bookingReference || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.payment?.booking?.customer
                          ? `${t.payment.booking.customer.firstName} ${t.payment.booking.customer.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {t.payment?.provider || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        ₹{Number(t.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.providerReference || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div>
              Showing page {page} of {totalPages} ({total} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
