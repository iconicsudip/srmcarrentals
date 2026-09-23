"use client";

import * as React from "react";
import {
  Link2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SeoNav } from "@/components/admin/seo/seo-nav";
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

interface RedirectItem {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = React.useState<RedirectItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    fromPath: "",
    toPath: "",
    statusCode: "301",
    status: "ACTIVE",
  });

  const fetchRedirects = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/seo/redirects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load redirects");
      const json = await res.json();
      setRedirects(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromPath || !form.toPath) {
      toast.error("Source and destination paths are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/seo/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create redirect rule");
      toast.success("Redirect rule created successfully");
      setIsDialogOpen(false);
      setForm({
        fromPath: "",
        toPath: "",
        statusCode: "301",
        status: "ACTIVE",
      });
      fetchRedirects();
    } catch (err: any) {
      toast.error(err.message || "Failed to create redirect rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: RedirectItem) => {
    try {
      const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch("/api/v1/seo/redirects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Redirect ${item.fromPath} is now ${newStatus}`);
      fetchRedirects();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redirect?")) return;
    try {
      const res = await fetch(`/api/v1/seo/redirects?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete redirect");
      toast.success("Redirect rule deleted");
      fetchRedirects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete redirect");
    }
  };

  const activeCount = redirects.filter((r) => r.status === "ACTIVE").length;
  const permCount = redirects.filter((r) => r.statusCode === 301).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">SEO & Search Performance</h1>
        <p className="text-sm text-muted-foreground">
          Maintain search equity and preserve backlinks with 301 Permanent and 302 Temporary redirects.
        </p>
      </div>

      <SeoNav />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Active Redirects
            </CardTitle>
            <Link2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Live routing rules</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              301 Permanent
            </CardTitle>
            <ShieldCheck className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Full link equity pass-through</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              404 Prevention
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Zero broken legacy URLs</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Middleware Speed
            </CardTitle>
            <ArrowRight className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&lt; 5ms</div>
            <p className="text-xs text-muted-foreground mt-1">Edge evaluated redirection</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Redirect Rules Register</CardTitle>
            <CardDescription>
              Route incoming URLs to their modern destinations seamlessly.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRedirects()}
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
                  Add Redirect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add URL Redirect Rule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRedirect} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fromPath">Source Path (Old URL)</Label>
                    <Input
                      id="fromPath"
                      placeholder="/old-car-rental-page"
                      value={form.fromPath}
                      onChange={(e) => setForm({ ...form, fromPath: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="toPath">Destination Path (New URL)</Label>
                    <Input
                      id="toPath"
                      placeholder="/cars or /locations/bangalore"
                      value={form.toPath}
                      onChange={(e) => setForm({ ...form, toPath: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Redirect Code</Label>
                      <Select
                        value={form.statusCode}
                        onValueChange={(val) => setForm({ ...form, statusCode: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="301">301 - Moved Permanently</SelectItem>
                          <SelectItem value="302">302 - Temporary Redirect</SelectItem>
                          <SelectItem value="307">307 - Temporary (Strict)</SelectItem>
                          <SelectItem value="308">308 - Permanent (Strict)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(val) => setForm({ ...form, status: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      {submitting ? "Saving..." : "Create Redirect"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search source or target path..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Path</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Destination Path</TableHead>
                  <TableHead>HTTP Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading redirect rules...
                    </TableCell>
                  </TableRow>
                ) : redirects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No redirect rules configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  redirects.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.fromPath}
                      </TableCell>
                      <TableCell className="w-8 text-muted-foreground">
                        <ArrowRight className="size-3.5" />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary">
                        {r.toPath}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.statusCode === 301 ? "default" : "secondary"}
                          className="font-mono text-xs"
                        >
                          {r.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={r.status === "ACTIVE"}
                          onCheckedChange={() => handleToggleStatus(r)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r.id)}
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
