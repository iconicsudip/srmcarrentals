"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgePercent,
  Plus,
  RefreshCw,
  Ticket,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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

interface DiscountRule {
  id: string;
  name: string;
  type: string;
  minDays: number;
  maxDays: number | null;
  discountPercentage: number;
  isActive: boolean;
  description: string;
}

export default function MarketingDiscountsPage() {
  const [rules, setRules] = React.useState<DiscountRule[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    type: "DURATION",
    minDays: "7",
    maxDays: "",
    discountPercentage: "10",
    isActive: true,
    description: "",
  });

  const fetchRules = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/marketing/discounts");
      if (!res.ok) throw new Error("Failed to load discount rules");
      const json = await res.json();
      setRules(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load discount rules");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.discountPercentage) {
      toast.error("Name and Discount Percentage are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/marketing/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save discount rule");
      toast.success("Discount rule created successfully");
      setIsDialogOpen(false);
      setForm({
        name: "",
        type: "DURATION",
        minDays: "7",
        maxDays: "",
        discountPercentage: "10",
        isActive: true,
        description: "",
      });
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to save discount rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rule: DiscountRule) => {
    try {
      const updated = { ...rule, isActive: !rule.isActive };
      const res = await fetch("/api/v1/marketing/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Discount rule "${rule.name}" ${updated.isActive ? "enabled" : "disabled"}`);
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to remove this discount rule?")) return;
    try {
      const res = await fetch(`/api/v1/marketing/discounts?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete discount rule");
      toast.success("Discount rule removed");
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete discount rule");
    }
  };

  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const maxDiscount = rules.reduce((max, r) => (r.discountPercentage > max ? r.discountPercentage : max), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Marketing & Promotions</h1>
        <p className="text-sm text-muted-foreground">
          Configure coupon codes, long-term rental duration discounts, and automatic pricing incentives.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Link
          href="/admin/marketing/coupons"
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
        >
          <Ticket className="size-3.5" />
          <span>Promo Coupons</span>
        </Link>
        <Link
          href="/admin/marketing/discounts"
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold bg-primary text-primary-foreground shadow-sm transition-all"
        >
          <BadgePercent className="size-3.5" />
          <span>Duration & Volume Discounts</span>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Active Tier Rules
            </CardTitle>
            <BadgePercent className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeRulesCount} of {rules.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Live in checkout calculation</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Maximum Long-Term Saver
            </CardTitle>
            <Sparkles className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {maxDiscount}% OFF
            </div>
            <p className="text-xs text-muted-foreground mt-1">Highest automatic duration perk</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Auto Application
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enabled</div>
            <p className="text-xs text-muted-foreground mt-1">No coupon code required</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Fleet Compatibility
            </CardTitle>
            <Calendar className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">All Cars</div>
            <p className="text-xs text-muted-foreground mt-1">Applied across entire catalog</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Automatic Duration Discounts</CardTitle>
            <CardDescription>
              Rules that dynamically discount the daily rate when customers book for multiple days or weeks.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRules()}
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
                  Add Discount Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Duration Discount Rule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRule} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      placeholder="e.g. 7+ Days Weekly Saver"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="minDays">Min Rental Days</Label>
                      <Input
                        id="minDays"
                        type="number"
                        min="1"
                        value={form.minDays}
                        onChange={(e) => setForm({ ...form, minDays: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxDays">Max Days (Optional)</Label>
                      <Input
                        id="maxDays"
                        type="number"
                        placeholder="Leave blank for 30+"
                        value={form.maxDays}
                        onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                      <Input
                        id="discountPercentage"
                        type="number"
                        step="0.5"
                        placeholder="10"
                        value={form.discountPercentage}
                        onChange={(e) =>
                          setForm({ ...form, discountPercentage: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rule Type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(val) => setForm({ ...form, type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DURATION">Rental Duration Tier</SelectItem>
                          <SelectItem value="SEASONAL">Seasonal Promo</SelectItem>
                          <SelectItem value="EARLY_BIRD">Advance Early Bird</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Customer-facing Description</Label>
                    <Input
                      id="description"
                      placeholder="e.g. Save 10% on bookings of a week or more"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label className="text-sm">Enable Rule Immediately</Label>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
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
                      {submitting ? "Saving..." : "Create Rule"}
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
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rental Duration Threshold</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading discount rules...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No discount rules defined. Click "Add Discount Rule" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-semibold text-sm">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rule.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {rule.minDays} {rule.maxDays ? `to ${rule.maxDays}` : "+"} Days
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                        {rule.discountPercentage}% OFF
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {rule.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
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
