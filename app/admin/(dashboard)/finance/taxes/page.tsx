"use client";

import * as React from "react";
import {
  Percent,
  Plus,
  RefreshCw,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Info,
  Edit2,
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
import { Switch } from "@/components/ui/switch";

interface TaxItem {
  id: string;
  name: string;
  percentage: number | string;
  type: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
}

export default function FinanceTaxesPage() {
  const [taxes, setTaxes] = React.useState<TaxItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Add/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [taxForm, setTaxForm] = React.useState({
    name: "GST (18% Rent-a-cab)",
    percentage: "18",
    type: "PERCENTAGE",
    isDefault: true,
    status: "ACTIVE",
  });

  const fetchTaxes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/finance/taxes");
      if (!res.ok) throw new Error("Failed to load taxes");
      const json = await res.json();
      setTaxes(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load taxes");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxForm.name || !taxForm.percentage) {
      toast.error("Name and Percentage are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taxForm,
          percentage: parseFloat(taxForm.percentage),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create tax slab");
      }
      toast.success("Tax slab created successfully");
      setIsDialogOpen(false);
      setTaxForm({
        name: "",
        percentage: "",
        type: "PERCENTAGE",
        isDefault: false,
        status: "ACTIVE",
      });
      fetchTaxes();
    } catch (err: any) {
      toast.error(err.message || "Failed to create tax slab");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDefault = async (tax: TaxItem) => {
    try {
      const res = await fetch("/api/v1/finance/taxes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tax.id,
          isDefault: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to set default tax");
      toast.success(`${tax.name} set as primary default tax`);
      fetchTaxes();
    } catch (err: any) {
      toast.error(err.message || "Failed to update tax");
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (!confirm("Are you sure you want to remove this tax slab?")) return;
    try {
      const res = await fetch(`/api/v1/finance/taxes?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tax");
      toast.success("Tax slab deleted");
      fetchTaxes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tax");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor transactions, customer invoices, revenue settlements, and tax compliance.
        </p>
      </div>

      <FinanceNav />

      {/* Info Notice about Indian GST for Car Rentals */}
      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 flex items-start gap-3">
        <Info className="size-5 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-sky-600 dark:text-sky-400">
            GST Compliance for Passenger Transport & Car Rental Services (SAC 9966)
          </p>
          <p className="text-muted-foreground">
            Standard self-drive car rentals without fuel typically fall under 18% GST (CGST 9% + SGST 9% or IGST 18%).
            Chauffeur-driven cab services may utilize 5% (without ITC) or 12%/18% depending on the operating model.
            The default slab selected below is automatically calculated at checkout and printed on tax invoices.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Configured Tax Slabs</CardTitle>
            <CardDescription>
              Manage applicable taxes, GST percentages, and primary billing defaults.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTaxes()}
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
                  Add Tax Slab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tax Slab</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTax} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="taxName">Tax Name</Label>
                    <Input
                      id="taxName"
                      placeholder="e.g. GST (18% Rent-a-cab)"
                      value={taxForm.name}
                      onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="percentage">Percentage (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        step="0.01"
                        placeholder="18"
                        value={taxForm.percentage}
                        onChange={(e) =>
                          setTaxForm({ ...taxForm, percentage: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Calculation Type</Label>
                      <Select
                        value={taxForm.type}
                        onValueChange={(val) => setTaxForm({ ...taxForm, type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Default Tax Slab</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically apply this slab to all new bookings & quotes
                      </p>
                    </div>
                    <Switch
                      checked={taxForm.isDefault}
                      onCheckedChange={(checked) =>
                        setTaxForm({ ...taxForm, isDefault: checked })
                      }
                    />
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
                      {submitting ? "Saving..." : "Create Slab"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Slab Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading tax slabs...
                    </TableCell>
                  </TableRow>
                ) : taxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tax slabs configured yet. Click "Add Tax Slab" above.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold text-sm">{t.name}</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(t.percentage)}%
                      </TableCell>
                      <TableCell className="text-xs">{t.type}</TableCell>
                      <TableCell>
                        {t.isDefault ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Default
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleToggleDefault(t)}
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === "ACTIVE" ? "outline" : "secondary"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTax(t.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
