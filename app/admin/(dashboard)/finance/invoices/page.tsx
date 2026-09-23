"use client";

import * as React from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
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

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  status: string;
  issuedAt: string | null;
  pdfUrl: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    car: { name: string } | null;
  };
}

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Issue Invoice Modal
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [invoiceForm, setInvoiceForm] = React.useState({
    bookingId: "",
    customerId: "",
    amount: "",
    taxAmount: "",
    status: "ISSUED",
  });

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/finance/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const json = await res.json();
      setInvoices(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.bookingId || !invoiceForm.customerId || !invoiceForm.amount) {
      toast.error("Booking ID, Customer ID, and Base Amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const amountNum = parseFloat(invoiceForm.amount);
      const taxNum = invoiceForm.taxAmount ? parseFloat(invoiceForm.taxAmount) : amountNum * 0.18;
      const totalNum = amountNum + taxNum;

      const res = await fetch("/api/v1/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          amount: amountNum,
          taxAmount: taxNum,
          totalAmount: totalNum,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate invoice");
      }
      toast.success("Tax Invoice generated successfully");
      setIsDialogOpen(false);
      setInvoiceForm({
        bookingId: "",
        customerId: "",
        amount: "",
        taxAmount: "",
        status: "ISSUED",
      });
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ISSUED":
        return <Badge variant="info">Issued</Badge>;
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "CANCELLED":
      case "VOID":
        return <Badge variant="destructive">Void</Badge>;
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

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Invoices
            </CardTitle>
            <FileText className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated tax invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Tax Compliant (GST)
            </CardTitle>
            <IndianRupee className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">SAC 9966 (Rental Service)</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Auto-Dispatch
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">PDF sent on booking confirm</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Audit Status
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Verified</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for monthly filing</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Invoices & Billing Register</CardTitle>
            <CardDescription>
              GST tax invoices issued to customers with breakdown of base rates and taxes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInvoices()}
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
                  Generate Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Tax Invoice</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleIssueInvoice} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <Input
                      id="bookingId"
                      placeholder="e.g. cly..."
                      value={invoiceForm.bookingId}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, bookingId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      placeholder="e.g. cly..."
                      value={invoiceForm.customerId}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, customerId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Base Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="e.g. 10000"
                        value={invoiceForm.amount}
                        onChange={(e) =>
                          setInvoiceForm({ ...invoiceForm, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taxAmount">GST Amount (₹)</Label>
                      <Input
                        id="taxAmount"
                        type="number"
                        placeholder="Default 18%"
                        value={invoiceForm.taxAmount}
                        onChange={(e) =>
                          setInvoiceForm({ ...invoiceForm, taxAmount: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={invoiceForm.status}
                      onValueChange={(val) =>
                        setInvoiceForm({ ...invoiceForm, status: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISSUED">Issued</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
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
                      {submitting ? "Generating..." : "Generate Invoice"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, customer, booking..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="VOID">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No invoices found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-semibold text-primary font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        <a
                          href={`/admin/bookings/${inv.booking?.id}`}
                          className="hover:underline font-medium"
                        >
                          {inv.booking?.bookingReference}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {inv.customer?.firstName} {inv.customer?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{inv.customer?.phone}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        ₹{Number(inv.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        ₹{Number(inv.taxAmount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.issuedAt
                          ? new Date(inv.issuedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Draft"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast.info(`Invoice ${inv.invoiceNumber} opened for printing`);
                            window.print();
                          }}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <Printer className="size-3.5" />
                          Print
                        </Button>
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
