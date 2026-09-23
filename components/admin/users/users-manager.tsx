"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Search, UserX } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRoles } from "@/hooks/use-roles";
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeactivateAdminUser,
  useUpdateAdminUser,
  type AdminUserDto,
} from "@/hooks/use-admin-users";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roleId: z.string().min(1),
});
const editSchema = createSchema.extend({ password: z.string().min(8).optional().or(z.literal("")), isActive: z.boolean() });
type FormValues = z.infer<typeof editSchema>;

interface UsersManagerProps {
  title: string;
  description: string;
  /** RoleName values this screen is scoped to, e.g. ["SUPER_ADMIN","ADMIN"] for Admin Users. */
  roleNames: string[];
  entityLabel: string;
}

export function UsersManager({ title, description, roleNames, entityLabel }: UsersManagerProps) {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUserDto | null>(null);
  const [deactivating, setDeactivating] = React.useState<AdminUserDto | null>(null);

  const { data, isLoading } = useAdminUsers({ page, limit: 10, search: search || undefined, roles: roleNames });
  const { data: roles } = useRoles();
  const scopedRoleOptions = (roles ?? [])
    .filter((r) => roleNames.includes(r.name))
    .map((r) => ({ label: r.label, value: r.id }));

  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const deactivateMutation = useDeactivateAdminUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", phone: "", roleId: "", isActive: true },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ email: "", password: "", firstName: "", lastName: "", phone: "", roleId: "", isActive: true });
    setDialogOpen(true);
  }

  function openEdit(user: AdminUserDto) {
    setEditing(user);
    form.reset({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      roleId: user.role.id,
      isActive: user.isActive,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        const { password, ...rest } = values;
        await updateMutation.mutateAsync({ id: editing.id, data: { ...rest, password: password || undefined } });
        toast.success(`${entityLabel} updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`${entityLabel} created`);
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Something went wrong");
    }
  }

  const columns: ColumnDef<AdminUserDto>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-muted-foreground text-xs">{row.original.email}</div>
        </div>
      ),
    },
    { id: "role", header: "Role", cell: ({ row }) => <Badge variant="outline">{row.original.role.label}</Badge> },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "muted"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
    },
    {
      id: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleDateString() : "Never"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          {row.original.isActive && (
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeactivating(row.original)}>
              <UserX className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({ data: data?.data ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add {entityLabel}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${entityLabel.toLowerCase()}s...`}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                    No {entityLabel.toLowerCase()}s found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data?.meta && data.meta.total > 0 && (
            <div className="text-muted-foreground flex items-center justify-between pt-4 text-sm">
              <span>
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled={!!editing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scopedRoleOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{editing ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editing && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:col-span-2">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.firstName}?`}
        description="They will no longer be able to sign in. This can be reversed by editing the account."
        confirmLabel="Deactivate"
        loading={deactivateMutation.isPending}
        onConfirm={async () => {
          if (!deactivating) return;
          try {
            await deactivateMutation.mutateAsync(deactivating.id);
            toast.success(`${entityLabel} deactivated`);
            setDeactivating(null);
          } catch (error) {
            toast.error(error instanceof ApiRequestError ? error.message : "Could not deactivate");
          }
        }}
      />
    </div>
  );
}
