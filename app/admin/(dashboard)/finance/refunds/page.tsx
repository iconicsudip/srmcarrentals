"use client";

import * as React from "react";
import {
  Undo2,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Coins,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RefundItem {
  id: string;
  amount: number | string;
  reason: string | null;
  status: string;
  providerRefundId: string | null;
  processedAt: string | null;
  createdAt: string;
  payment: {
    id: string;
    provider: string;
    booking: {
      id: string;
      bookingReference: string;
      customer: { firstName: string; lastName: string; phone: string };
    } | null;
  };
}

export default function FinanceRefundsPage() {
  const [refunds, setRefunds] = React.useState<RefundItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Process Refund Modal
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [refundForm, setRefundForm] = React.useState({
    paymentId: "",
    amount: "",
    reason: "Deposit return after car inspection completed",
    status: "PROCESSED",
  });

  const fetchRefunds = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });

      const res = await fetch(`/api/v1/finance/refunds?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load refunds");
      const json = await res.json();
      setRefunds(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  React.useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.paymentId || !refundForm.amount) {
      toast.error("Payment ID and Refund Amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...refundForm,
          amount: parseFloat(refundForm.amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to process refund");
      }
      toast.success("Refund processed successfully");
      setIsDialogOpen(false);
      setRefundForm({
        paymentId: "",
        amount: "",
        reason: "Deposit return after car inspection completed",
        status: "PROCESSED",
      });
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.message || "Failed to process refund");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
      case "COMPLETED":
        return <Badge variant="success">Processed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
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
              Total Refund Requests
            </CardTitle>
            <Undo2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged refunds</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Security Deposit Returns
            </CardTitle>
            <Coins className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Returned upon vehicle return</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Settlement SLA
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&lt; 24 Hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Average turnaround</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Disputed Returns
            </CardTitle>
            <AlertTriangle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">All disputes resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Refunds & Security Deposit Reversals</CardTitle>
            <CardDescription>
              Disbursement records, reversal transactions, and security holds cleared.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRefunds()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Process Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Refund / Deposit Release</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProcessRefund} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentId">Original Payment ID</Label>
                    <Input
                      id="paymentId"
                      placeholder="Payment CUID or Reference"
                      value={refundForm.paymentId}
                      onChange={(e) =>
                        setRefundForm({ ...refundForm, paymentId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refundAmount">Refund Amount (₹)</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      placeholder="e.g. 3000"
                      value={refundForm.amount}
                      onChange={(e) =>
                        setRefundForm({ ...refundForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Reason for Refund</Label>
                    <Input
                      id="reason"
                      value={refundForm.reason}
                      onChange={(e) =>
                        setRefundForm({ ...refundForm, reason: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={refundForm.status}
                      onValueChange={(val) =>
                        setRefundForm({ ...refundForm, status: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROCESSED">Processed / Sent</SelectItem>
                        <SelectItem value="PENDING">Pending Bank Clearing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Processing..." : "Submit Refund"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund ID</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading refunds...
                    </TableCell>
                  </TableRow>
                ) : refunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No refunds found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  refunds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.id.slice(0, 10)}...
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        {r.payment?.booking?.bookingReference || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.payment?.booking?.customer
                          ? `${r.payment.booking.customer.firstName} ${r.payment.booking.customer.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-rose-600 dark:text-rose-400">
                        ₹{Number(r.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {r.reason || "Deposit refund"}
                      </TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.providerRefundId || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.processedAt
                          ? new Date(r.processedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
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
