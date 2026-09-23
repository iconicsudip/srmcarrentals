"use client";

import * as React from "react";
import Link from "next/link";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ClipboardX, Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBookingList, type BookingListItem } from "@/hooks/use-bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "muted" | "destructive"> = {
  PENDING: "warning",
  PAYMENT_PENDING: "warning",
  CONFIRMED: "info",
  DRIVER_ASSIGNED: "info",
  OUT_FOR_PICKUP: "info",
  ACTIVE: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REJECTED: "destructive",
};

export function BookingsList({ title, description, status }: { title: string; description: string; status?: string }) {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput, 300);

  const { data, isLoading } = useBookingList({ page, limit: 10, status, search: search || undefined });

  const columns: ColumnDef<BookingListItem>[] = [
    {
      id: "reference",
      header: "Booking",
      cell: ({ row }) => (
        <Link href={`/admin/bookings/${row.original.id}`} className="font-medium hover:underline">
          {row.original.bookingReference}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div>
            {row.original.customer.firstName} {row.original.customer.lastName}
          </div>
          <div className="text-muted-foreground text-xs">{row.original.customer.phone}</div>
        </div>
      ),
    },
    {
      id: "car",
      header: "Car",
      cell: ({ row }) => `${row.original.car.brand.name} ${row.original.car.model.name}`,
    },
    {
      id: "dates",
      header: "Dates",
      cell: ({ row }) => (
        <span className="text-xs">
          {new Date(row.original.pickupDateTime).toLocaleDateString()} → {new Date(row.original.dropDateTime).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => (row.original.pricingSnapshot ? `₹${Number(row.original.pricingSnapshot.grandTotal).toLocaleString("en-IN")}` : "—"),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status] ?? "muted"}>{row.original.status.replace(/_/g, " ")}</Badge>,
    },
  ];

  const table = useReactTable({ data: data?.data ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
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
              placeholder="Search by reference, customer name, or email..."
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <ClipboardX className="text-muted-foreground/50 size-8" />
                      <span>No bookings found.</span>
                    </div>
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
    </div>
  );
}
