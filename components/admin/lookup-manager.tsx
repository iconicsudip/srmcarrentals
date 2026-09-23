"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useCreateLookup,
  useDeleteLookup,
  useLookupList,
  useUpdateLookup,
  type LookupListParams,
} from "@/hooks/use-lookup-crud";
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
import { Textarea } from "@/components/ui/textarea";

export interface LookupField {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "url" | "select" | "tags" | "date" | "switch";
  placeholder?: string;
  selectOptions?: { label: string; value: string }[];
  /** Shown under the field, e.g. hint text for "tags" fields. */
  description?: string;
}

export interface LookupColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

export interface LookupRow {
  id: string;
  status?: "ACTIVE" | "INACTIVE";
}

interface LookupManagerProps<T extends LookupRow> {
  title: string;
  description?: string;
  basePath: string;
  queryKey: string[];
  columns: LookupColumn<T>[];
  fields: LookupField[];
  formSchema: z.ZodType<Record<string, unknown>, Record<string, unknown>>;
  getEditDefaultValues?: (row: T) => Record<string, unknown>;
  createDefaultValues?: Record<string, unknown>;
  searchPlaceholder?: string;
  hasStatus?: boolean;
  hasSearch?: boolean;
  extraParams?: Record<string, string>;
  entityLabel?: string;
  /** Optional extra actions rendered next to the "Add New" button in the header */
  headerActions?: React.ReactNode;
}

/**
 * Generic Create/Edit/Delete/Search/Paginate/Status-toggle admin screen used
 * by every "Car Rental" lookup page (Brands, Models, Colors, Seats, ...).
 * Talks to any endpoint built with lib/http/lookup-crud.ts on the backend.
 */
export function LookupManager<T extends LookupRow>({
  title,
  description,
  basePath,
  queryKey,
  columns,
  fields,
  formSchema,
  getEditDefaultValues,
  createDefaultValues,
  searchPlaceholder,
  hasStatus = true,
  hasSearch = true,
  extraParams,
  entityLabel = "record",
  headerActions,
}: LookupManagerProps<T>) {
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<T | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<T | null>(null);

  const params: LookupListParams = { page, limit, search: search || undefined, status: statusFilter, extraParams };
  const { data, isLoading, isFetching } = useLookupList<T>(basePath, queryKey, params);
  const createMutation = useCreateLookup<T>(basePath, queryKey);
  const updateMutation = useUpdateLookup<T>(basePath, queryKey);
  const deleteMutation = useDeleteLookup(basePath, queryKey);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues ?? {},
  });

  function openCreate() {
    setEditingRow(null);
    form.reset(createDefaultValues ?? {});
    setDialogOpen(true);
  }

  function openEdit(row: T) {
    setEditingRow(row);
    form.reset(getEditDefaultValues ? getEditDefaultValues(row) : (row as unknown as Record<string, unknown>));
    setDialogOpen(true);
  }

  async function onSubmit(values: Record<string, unknown>) {
    try {
      if (editingRow) {
        await updateMutation.mutateAsync({ id: editingRow.id, data: values });
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

  async function confirmDelete() {
    if (!deletingRow) return;
    try {
      await deleteMutation.mutateAsync(deletingRow.id);
      toast.success(`${entityLabel} deleted`);
      setDeletingRow(null);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Something went wrong");
    }
  }

  async function toggleStatus(row: T) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMutation.mutateAsync({ id: row.id, data: { status: next } });
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not update status");
    }
  }

  const tableColumns: ColumnDef<T>[] = columns.map((c) => ({
    id: c.header,
    header: c.header,
    cell: ({ row }) => c.cell(row.original),
  }));

  if (hasStatus) {
    tableColumns.push({
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.original.status === "ACTIVE"} onCheckedChange={() => toggleStatus(row.original)} />
          <Badge variant={row.original.status === "ACTIVE" ? "success" : "muted"}>
            {row.original.status ?? "—"}
          </Badge>
        </div>
      ),
    });
  }

  tableColumns.push({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row.original)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive size-8"
          onClick={() => setDeletingRow(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add New
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
          {hasSearch && (
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder ?? "Search..."}
                className="pl-8"
              />
            </div>
          )}
          {hasStatus && (
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {tableColumns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="text-muted-foreground h-24 text-center">
                    No results found.
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

          {meta && meta.total > 0 && (
            <div className="text-muted-foreground flex items-center justify-between pt-4 text-sm">
              <span>
                Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of{" "}
                {meta.total}
                {isFetching && "…"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
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
            <DialogTitle>{editingRow ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldConfig.label}</FormLabel>
                      <FormControl>
                        {fieldConfig.type === "switch" ? (
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        ) : fieldConfig.type === "date" ? (
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? String(field.value).slice(0, 10) : ""}
                          />
                        ) : fieldConfig.type === "textarea" ? (
                          <Textarea
                            placeholder={fieldConfig.placeholder}
                            {...field}
                            value={(field.value as string) ?? ""}
                          />
                        ) : fieldConfig.type === "tags" ? (
                          <Input
                            placeholder={fieldConfig.placeholder ?? "Comma separated"}
                            value={((field.value as string[]) ?? []).join(", ")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .split(",")
                                  .map((v) => v.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        ) : fieldConfig.type === "select" ? (
                          <Select value={(field.value as string) ?? ""} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={fieldConfig.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldConfig.selectOptions?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fieldConfig.type === "number" ? "number" : fieldConfig.type === "url" ? "url" : "text"}
                            placeholder={fieldConfig.placeholder}
                            {...field}
                            value={(field.value as string | number) ?? ""}
                          />
                        )}
                      </FormControl>
                      {fieldConfig.description && (
                        <p className="text-muted-foreground text-xs">{fieldConfig.description}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingRow ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingRow}
        onOpenChange={(open) => !open && setDeletingRow(null)}
        title={`Delete this ${entityLabel}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
