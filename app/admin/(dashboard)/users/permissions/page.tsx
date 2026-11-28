"use client";

import * as React from "react";
import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import { useCreatePermission, useDeletePermission, usePermissions, type PermissionDto } from "@/hooks/use-roles";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function PermissionsPage() {
  const { data: permissions, isLoading } = usePermissions();
  const createPermission = useCreatePermission();
  const deletePermission = useDeletePermission();

  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [deleting, setDeleting] = React.useState<PermissionDto | null>(null);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, PermissionDto[]>();
    for (const p of permissions ?? []) {
      const list = groups.get(p.group) ?? [];
      list.push(p);
      groups.set(p.group, list);
    }
    return groups;
  }, [permissions]);

  async function handleCreate() {
    try {
      await createPermission.mutateAsync({ key, group: group || undefined, description: description || undefined });
      toast.success("Permission created — attach it to a role under Roles");
      setOpen(false);
      setKey("");
      setGroup("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not create the permission");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePermission.mutateAsync(deleting.id);
      toast.success("Permission deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not delete the permission");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Every permission, grouped by module. Built-in ones control the admin screens; add your own for new areas, then attach them to
            roles under Roles.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 size-4" /> New permission
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(grouped.entries()).map(([groupName, perms]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-sm tracking-wide uppercase">{groupName}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex min-w-0 items-center gap-1.5">
                      <KeyRound className="size-3.5 shrink-0" />
                      <span className="truncate" title={p.description ?? p.key}>
                        {p.key}
                      </span>
                      {p.isSystem === false && <Badge variant="outline">Custom</Badge>}
                    </span>
                    {p.isSystem === false && (
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleting(p)} aria-label={`Delete ${p.key}`}>
                        <Trash2 className="size-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New permission</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="perm-key">Key</Label>
              <Input id="perm-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="reports.view" />
              <p className="text-muted-foreground text-xs">Lower-case words joined by dots, like cars.edit or reports.view.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="perm-group">Group (optional)</Label>
              <Input id="perm-group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="reports" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="perm-desc">What it allows (optional)</Label>
              <Input id="perm-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createPermission.isPending || !key.trim()}>
              {createPermission.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this permission?"
        description={`"${deleting?.key ?? ""}" is removed from every role that has it.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deletePermission.isPending}
      />
    </div>
  );
}
