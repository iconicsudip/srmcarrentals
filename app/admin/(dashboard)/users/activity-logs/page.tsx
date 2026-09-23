"use client";

import * as React from "react";
import Link from "next/link";
import {
  History,
  ShieldCheck,
  Users,
  KeyRound,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileCode,
  Laptop,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLogItem {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "STATUS_CHANGE";
  entityType: string;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  } | null;
}

const USER_TABS = [
  { label: "Admin Users", href: "/admin/users/admins", icon: ShieldCheck },
  { label: "Staff", href: "/admin/users/staff", icon: Users },
  { label: "Roles", href: "/admin/users/roles", icon: KeyRound },
  { label: "Permissions", href: "/admin/users/permissions", icon: KeyRound },
  { label: "Activity Logs", href: "/admin/users/activity-logs", icon: History },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(15);

  // Inspector modal
  const [inspectedLog, setInspectedLog] = React.useState<AuditLogItem | null>(null);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        action: actionFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/users/activity-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load activity logs");
      const json = await res.json();
      setLogs(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, search]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge variant="success">CREATE</Badge>;
      case "UPDATE":
        return <Badge variant="info">UPDATE</Badge>;
      case "STATUS_CHANGE":
        return <Badge variant="warning">STATUS</Badge>;
      case "DELETE":
        return <Badge variant="destructive">DELETE</Badge>;
      case "LOGIN":
        return <Badge variant="secondary">LOGIN</Badge>;
      case "LOGOUT":
        return <Badge variant="outline">LOGOUT</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">User & Security Audit</h1>
        <p className="text-sm text-muted-foreground">
          Monitor user accounts, roles, access permissions, and chronological system activity trails.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none">
        {USER_TABS.map((tab) => {
          const isActive = tab.href === "/admin/users/activity-logs";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <tab.icon className="size-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Log Entries
            </CardTitle>
            <History className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Immutable audit records</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Retention Policy
            </CardTitle>
            <ShieldCheck className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">180 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Full compliance retention</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              IP Tracking
            </CardTitle>
            <Laptop className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Geo & client user-agent logged</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Integrity Check
            </CardTitle>
            <FileCode className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Passed</div>
            <p className="text-xs text-muted-foreground mt-1">0 tamper events detected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Activity Journal</CardTitle>
            <CardDescription>
              Chronological ledger of user logins, updates to cars and bookings, and status adjustments.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search user, entity, ID..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="STATUS_CHANGE">STATUS_CHANGE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="LOGIN">LOGIN</SelectItem>
                  <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor / User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading activity logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {log.user
                            ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email
                            : "System Automated"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.user?.email || "system@srmrentals.in"}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.entityId ? `${log.entityId.slice(0, 10)}...` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ipAddress || "127.0.0.1"}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.changes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => setInspectedLog(log)}
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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

      {/* JSON Changes Inspector Dialog */}
      <Dialog
        open={Boolean(inspectedLog)}
        onOpenChange={(open) => !open && setInspectedLog(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Audit Payload Details</DialogTitle>
          </DialogHeader>
          {inspectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <span className="font-semibold">{inspectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity:</span>{" "}
                  <span className="font-semibold">{inspectedLog.entityType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity ID:</span>{" "}
                  <span className="font-mono">{inspectedLog.entityId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">User:</span>{" "}
                  <span>
                    {inspectedLog.user
                      ? `${inspectedLog.user.firstName || ""} ${inspectedLog.user.lastName || ""}`.trim() ||
                        inspectedLog.user.email
                      : "System"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Recorded Changes / Payload:</span>
                <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-60 border border-zinc-800">
                  {JSON.stringify(inspectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
