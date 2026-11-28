"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Save, ShieldCheck, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import { useCreateRole, useDeleteRole, usePermissions, useRoles, useUpdateRole, type RoleDto } from "@/hooks/use-roles";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const [editing, setEditing] = React.useState<RoleDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<RoleDto | null>(null);
  const deleteRole = useDeleteRole();

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteRole.mutateAsync(deleting.id);
      toast.success("Role deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not delete the role");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-muted-foreground text-sm">
            A role is a set of permissions. Create your own (for example &quot;City Manager&quot;), choose what it can do, then assign it to
            staff under Users. Super Admin always has every permission.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 size-4" /> New role
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles?.map((role) => (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="text-muted-foreground size-4" /> {role.label}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                    <Users2 className="size-3" /> {role._count.users} user{role._count.users === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(role)} aria-label={`Edit ${role.label}`}>
                    <Pencil className="size-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(role)} aria-label={`Delete ${role.label}`}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {role.description && <p className="text-muted-foreground mb-3 text-sm">{role.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={role.permissions.length > 0 ? "success" : "muted"}>
                    {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                  </Badge>
                  {role.isSystem && <Badge variant="outline">Built-in</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && <EditRoleDialog role={editing} onOpenChange={(open) => !open && setEditing(null)} />}
      {creating && <EditRoleDialog role={null} onOpenChange={(open) => !open && setCreating(false)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this role?"
        description={`"${deleting?.label ?? ""}" will be removed. A role that still has users cannot be deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={deleteRole.isPending}
      />
    </div>
  );
}

function EditRoleDialog({ role, onOpenChange }: { role: RoleDto | null; onOpenChange: (open: boolean) => void }) {
  const { data: permissions, isLoading } = usePermissions();
  const updateRole = useUpdateRole();
  const createRole = useCreateRole();
  const busy = updateRole.isPending || createRole.isPending;

  const [label, setLabel] = React.useState(role?.label ?? "");
  const [description, setDescription] = React.useState(role?.description ?? "");
  const [selected, setSelected] = React.useState<Set<string>>(new Set(role?.permissions.map((p) => p.permission.key) ?? []));

  const grouped = React.useMemo(() => {
    const groups = new Map<string, typeof permissions>();
    for (const p of permissions ?? []) {
      const list = groups.get(p.group) ?? [];
      list.push(p);
      groups.set(p.group, list);
    }
    return groups;
  }, [permissions]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (label.trim().length < 2) {
      toast.error("Give the role a name");
      return;
    }
    try {
      if (role) {
        await updateRole.mutateAsync({ id: role.id, data: { label, description, permissionKeys: Array.from(selected) } });
        toast.success("Role updated");
      } else {
        await createRole.mutateAsync({ name: label, label, description: description || undefined, permissionKeys: Array.from(selected) });
        toast.success("Role created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save the role");
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? `Edit Role — ${role.label}` : "New Role"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Role name</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Permissions</Label>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="grid max-h-96 gap-4 overflow-y-auto rounded-lg border p-4">
                {Array.from(grouped.entries()).map(([group, perms]) => (
                  <div key={group}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{group}</p>
                      <button
                        type="button"
                        className="text-primary text-[11px] hover:underline"
                        onClick={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            const all = perms?.every((p) => next.has(p.key));
                            for (const p of perms ?? []) {
                              if (all) next.delete(p.key);
                              else next.add(p.key);
                            }
                            return next;
                          })
                        }
                      >
                        {perms?.every((p) => selected.has(p.key)) ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {perms?.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={selected.has(p.key)} onCheckedChange={() => toggle(p.key)} />
                          {p.key}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {role ? "Save Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
