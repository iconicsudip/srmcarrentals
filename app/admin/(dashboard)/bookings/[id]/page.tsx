"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { CarFront, Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError } from "@/lib/api-client";
import { useLookupOptions } from "@/hooks/use-lookup-options";
import {
  useAssignDriverToBooking,
  useBooking,
  useCancelBooking,
  useCompleteTrip,
  useConfirmBooking,
  useStartTrip,
} from "@/hooks/use-bookings";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function formatInr(v: string | number) {
  return `₹${Number(v).toLocaleString("en-IN")}`;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: booking, isLoading } = useBooking(id);
  const confirmMutation = useConfirmBooking();
  const cancelMutation = useCancelBooking();
  const assignDriverMutation = useAssignDriverToBooking();
  const startTripMutation = useStartTrip();
  const completeTripMutation = useCompleteTrip();
  const drivers = useLookupOptions<{ id: string; firstName: string; lastName: string }>("/drivers", "firstName");

  const [driverId, setDriverId] = React.useState("");
  const [cancelOpen, setCancelOpen] = React.useState(false);

  async function runAction(mutation: { mutateAsync: (args: { id: string; body?: Record<string, unknown> }) => Promise<unknown> }, body?: Record<string, unknown>, successMsg?: string) {
    try {
      await mutation.mutateAsync({ id, body });
      if (successMsg) toast.success(successMsg);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Action failed");
    }
  }

  if (isLoading || !booking) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const s = booking.pricingSnapshot;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{booking.bookingReference}</h1>
          <p className="text-muted-foreground text-sm">
            Created {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge className="text-sm">{booking.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CarFront className="size-4" /> Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Car" value={`${booking.car.brand.name} ${booking.car.model.name}`} />
              <Detail label="Pickup" value={new Date(booking.pickupDateTime).toLocaleString()} />
              <Detail label="Drop" value={new Date(booking.dropDateTime).toLocaleString()} />
              <Detail
                label="Pickup Location"
                value={booking.pickupIsAirport ? `${booking.pickupAirport?.name} (${booking.pickupAirport?.code})` : (booking.pickupLocation?.name ?? "—")}
              />
              <Detail
                label="Drop Location"
                value={booking.dropIsAirport ? `${booking.dropAirport?.name} (${booking.dropAirport?.code})` : (booking.dropLocation?.name ?? "—")}
              />
              <Detail label="Estimated KM" value={booking.estimatedKm ? `${booking.estimatedKm} km` : "—"} />
              {booking.actualPickupAt && <Detail label="Actual Pickup" value={new Date(booking.actualPickupAt).toLocaleString()} />}
              {booking.actualDropAt && <Detail label="Actual Drop" value={new Date(booking.actualDropAt).toLocaleString()} />}
              {booking.actualKm && <Detail label="Actual KM" value={`${booking.actualKm} km`} />}
              {booking.cancellationReason && <Detail label="Cancellation Reason" value={booking.cancellationReason} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="font-medium">
                {booking.customer.firstName} {booking.customer.lastName}
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> {booking.customer.phone}
              </div>
              <div className="text-muted-foreground">{booking.customer.email}</div>
              <Link href={`/admin/customers`} className="text-primary mt-1 text-xs hover:underline">
                View customer records →
              </Link>
            </CardContent>
          </Card>

          {s && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price Breakdown (Immutable Snapshot)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <Row label="Rental Price" value={s.rentalPrice} />
                {Number(s.extraHourCharge) > 0 && <Row label="Extra Hour Charge" value={s.extraHourCharge} />}
                {Number(s.extraKmCharge) > 0 && <Row label="Extra KM Charge" value={s.extraKmCharge} />}
                {Number(s.airportPickupCharge) > 0 && <Row label="Airport Pickup Charge" value={s.airportPickupCharge} />}
                {Number(s.airportDropCharge) > 0 && <Row label="Airport Drop Charge" value={s.airportDropCharge} />}
                {Number(s.seasonalAdjustment) !== 0 && <Row label="Seasonal Adjustment" value={s.seasonalAdjustment} />}
                {Number(s.servicesTotal) > 0 && <Row label="Extra Services" value={s.servicesTotal} />}
                {Number(s.insuranceCharge) > 0 && <Row label="Insurance" value={s.insuranceCharge} />}
                {Number(s.discount) > 0 && <Row label={`Discount${s.couponCode ? ` (${s.couponCode})` : ""}`} value={`-${formatInr(s.discount)}`} raw />}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatInr(s.subtotal)}</span>
                </div>
                <Row label={`Tax (${s.taxPercentage}%)`} value={s.taxAmount} />
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Grand Total</span>
                  <span>{formatInr(s.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(booking.status === "PENDING" || booking.status === "PAYMENT_PENDING") && (
                <Button
                  onClick={() => runAction(confirmMutation, undefined, "Booking confirmed")}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Confirm Booking
                </Button>
              )}

              {(booking.status === "CONFIRMED" || booking.status === "DRIVER_ASSIGNED") && (
                <div className="flex flex-col gap-2">
                  <Select value={driverId} onValueChange={setDriverId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!driverId || assignDriverMutation.isPending}
                    onClick={() => runAction(assignDriverMutation, { driverId }, "Driver assigned")}
                  >
                    {assignDriverMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Assign Driver
                  </Button>
                </div>
              )}

              {["CONFIRMED", "DRIVER_ASSIGNED", "OUT_FOR_PICKUP"].includes(booking.status) && (
                <Button variant="outline" onClick={() => runAction(startTripMutation, undefined, "Trip started")} disabled={startTripMutation.isPending}>
                  {startTripMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Start Trip
                </Button>
              )}

              {booking.status === "ACTIVE" && (
                <Button
                  onClick={() => runAction(completeTripMutation, { actualKm: booking.estimatedKm }, "Trip completed")}
                  disabled={completeTripMutation.isPending}
                >
                  {completeTripMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Complete Trip
                </Button>
              )}

              {!["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status) && (
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancel Booking
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4" /> Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.driver ? (
                <p className="text-sm">
                  {booking.driver.firstName} {booking.driver.lastName}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Not yet assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="This releases the car for other bookings and cannot be undone."
        confirmLabel="Cancel Booking"
        loading={cancelMutation.isPending}
        onConfirm={async () => {
          await runAction(cancelMutation, { reason: "Cancelled by admin" }, "Booking cancelled");
          setCancelOpen(false);
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Row({ label, value, raw }: { label: string; value: string | number; raw?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{raw ? value : formatInr(value)}</span>
    </div>
  );
}
