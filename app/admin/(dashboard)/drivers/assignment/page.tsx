"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserCheck,
  UserCog,
  Car,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  driverStatus: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "INACTIVE";
}

interface Booking {
  id: string;
  bookingReference: string;
  status: string;
  startDate: string;
  endDate: string;
  pickupLocation?: { name: string };
  dropoffLocation?: { name: string };
  car: { name: string };
  customer: { firstName: string; lastName: string; phone: string };
  driver?: { id: string; firstName: string; lastName: string; phone: string } | null;
}

export default function DriverAssignmentPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Assign modal
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [selectedDriverId, setSelectedDriverId] = React.useState<string>("");
  const [assigning, setAssigning] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, driversRes] = await Promise.all([
        fetch("/api/v1/bookings?limit=50"),
        fetch("/api/v1/drivers?limit=100"),
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.data || []);
      }
      if (driversRes.ok) {
        const dData = await driversRes.json();
        setDrivers(dData.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load dispatch data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignDriver = async () => {
    if (!selectedBooking || !selectedDriverId) {
      toast.error("Please select a chauffeur to assign");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/v1/bookings/${selectedBooking.id}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to assign chauffeur");
      }
      toast.success(
        `Chauffeur assigned to booking ${selectedBooking.bookingReference} successfully`
      );
      setSelectedBooking(null);
      setSelectedDriverId("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign chauffeur");
    } finally {
      setAssigning(false);
    }
  };

  // Filter bookings that need driver or confirmed
  const filteredBookings = bookings.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      const matchCustomer = `${b.customer.firstName} ${b.customer.lastName}`.toLowerCase().includes(q);
      const matchCar = b.car.name.toLowerCase().includes(q);
      if (!matchRef && !matchCustomer && !matchCar) return false;
    }
    return true;
  });

  const unassignedCount = bookings.filter(
    (b) => !b.driver && ["CONFIRMED", "PAYMENT_PENDING", "PENDING"].includes(b.status)
  ).length;

  const availableDrivers = drivers.filter(
    (d) => d.driverStatus === "AVAILABLE" || (d as any).status === "AVAILABLE"
  );
  const onTripDrivers = drivers.filter(
    (d) => d.driverStatus === "ON_TRIP" || (d as any).status === "ON_TRIP"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Assignment & Dispatch</h1>
          <p className="text-sm text-muted-foreground">
            Manage chauffeur assignments, dispatch active trips, and track chauffeur availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/drivers">Manage Chauffeurs</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Awaiting Chauffeur
            </CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {unassignedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed bookings needing driver</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Available Chauffeurs
            </CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {availableDrivers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for immediate dispatch</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              On Active Trips
            </CardTitle>
            <Car className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {onTripDrivers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently on duty</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Total Roster
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered verified drivers</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch Board Table */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Dispatch Queue & Bookings</CardTitle>
            <CardDescription>
              Assign available chauffeurs to pending and confirmed bookings.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search reference, customer, car..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Car Selected</TableHead>
                  <TableHead>Rental Period</TableHead>
                  <TableHead>Assigned Chauffeur</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading dispatch queue...
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold text-primary">
                        <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                          {b.bookingReference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {b.customer.firstName} {b.customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{b.customer.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{b.car.name}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>
                          {new Date(b.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(b.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.driver ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <UserCheck className="size-3.5 text-emerald-500" />
                            <span className="font-medium">
                              {b.driver.firstName} {b.driver.lastName}
                            </span>
                            <span className="text-muted-foreground">({b.driver.phone})</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={b.driver ? "outline" : "default"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => {
                            setSelectedBooking(b);
                            setSelectedDriverId(b.driver?.id || "");
                          }}
                        >
                          <UserCog className="size-3.5" />
                          {b.driver ? "Reassign" : "Assign"}
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

      {/* Assignment Modal */}
      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Chauffeur to Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border p-3 space-y-1 text-xs bg-muted/30">
                <div className="flex justify-between font-semibold">
                  <span>Reference: {selectedBooking.bookingReference}</span>
                  <span className="text-primary">{selectedBooking.car.name}</span>
                </div>
                <div className="text-muted-foreground">
                  Customer: {selectedBooking.customer.firstName} {selectedBooking.customer.lastName} (
                  {selectedBooking.customer.phone})
                </div>
                <div className="text-muted-foreground">
                  Dates: {new Date(selectedBooking.startDate).toLocaleDateString()} to{" "}
                  {new Date(selectedBooking.endDate).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="driverSelect">Select Chauffeur</Label>
                <Select
                  value={selectedDriverId}
                  onValueChange={(val) => setSelectedDriverId(val)}
                >
                  <SelectTrigger id="driverSelect">
                    <SelectValue placeholder="Choose an available chauffeur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.firstName} {d.lastName} ({d.phone}) —{" "}
                        {d.driverStatus || (d as any).status || "AVAILABLE"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAssignDriver}
                  disabled={assigning || !selectedDriverId}
                >
                  {assigning ? "Assigning..." : "Confirm Assignment"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
