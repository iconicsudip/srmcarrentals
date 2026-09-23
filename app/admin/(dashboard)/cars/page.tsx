"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { CarFront, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCarList, useDeleteCar } from "@/hooks/use-cars";
import { useLookupOptions } from "@/hooks/use-lookup-options";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CarListItem {
  id: string;
  name: string;
  slug: string;
  year: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  isFeatured: boolean;
  brand: { name: string };
  model: { name: string };
  category: { name: string };
  carType: { name: string };
  images: { url: string; altText: string | null }[];
  pricing: { dailyPrice: string } | null;
}

const STATUS_BADGE: Record<CarListItem["status"], "success" | "muted" | "warning"> = {
  DRAFT: "muted",
  ACTIVE: "success",
  INACTIVE: "muted",
  MAINTENANCE: "warning",
};

export default function CarsPage() {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = React.useState<string>("ALL");
  const [brandId, setBrandId] = React.useState<string>("ALL");
  const [categoryId, setCategoryId] = React.useState<string>("ALL");
  const [deletingCar, setDeletingCar] = React.useState<CarListItem | null>(null);

  const brands = useLookupOptions<{ id: string; name: string }>("/cars/brands", "name");
  const categories = useLookupOptions<{ id: string; name: string }>("/cars/categories", "name");

  const { data, isLoading, isFetching } = useCarList<CarListItem>({
    page,
    limit: 10,
    search: search || undefined,
    status: status !== "ALL" ? status : undefined,
    brandId: brandId !== "ALL" ? brandId : undefined,
    categoryId: categoryId !== "ALL" ? categoryId : undefined,
  });

  const deleteMutation = useDeleteCar();

  async function confirmDelete() {
    if (!deletingCar) return;
    try {
      await deleteMutation.mutateAsync(deletingCar.id);
      toast.success("Car deleted");
      setDeletingCar(null);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Could not delete this car — it may have existing bookings.",
      );
    }
  }

  const columns: ColumnDef<CarListItem>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) => {
        const image = row.original.images[0];
        return (
          <div className="bg-muted relative size-12 overflow-hidden rounded-md">
            {image ? (
              <Image src={image.url} alt={image.altText ?? row.original.name} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <CarFront className="size-5" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "name",
      header: "Car",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 font-medium">
            {row.original.name}
            {row.original.isFeatured && <Star className="fill-warning text-warning size-3.5" />}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.original.brand.name} {row.original.model.name} · {row.original.year}
          </span>
        </div>
      ),
    },
    { id: "category", header: "Category", cell: ({ row }) => row.original.category.name },
    { id: "type", header: "Type", cell: ({ row }) => row.original.carType.name },
    {
      id: "price",
      header: "24hr Price",
      cell: ({ row }) =>
        row.original.pricing ? `₹${Number(row.original.pricing.dailyPrice).toLocaleString("en-IN")}` : "—",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_BADGE[row.original.status]}>{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/admin/cars/${row.original.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive size-8"
            onClick={() => setDeletingCar(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Car Rental</h1>
          <p className="text-muted-foreground text-sm">Manage every car in your rental fleet.</p>
        </div>
        <Button asChild>
          <Link href="/admin/cars/new">
            <Plus className="size-4" />
            Add New Car
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0 pb-4">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search cars..."
              className="pl-8"
            />
          </div>
          <Select
            value={brandId}
            onValueChange={(v) => {
              setBrandId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All brands</SelectItem>
              {brands.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
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
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                    No cars found.
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

      <ConfirmDialog
        open={!!deletingCar}
        onOpenChange={(open) => !open && setDeletingCar(null)}
        title={`Delete "${deletingCar?.name}"?`}
        description="This action cannot be undone. Cars with existing bookings cannot be deleted."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
