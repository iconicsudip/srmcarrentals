"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { useCarList } from "@/hooks/use-cars";
import { CarPricingDialog } from "@/components/admin/pricing/car-pricing-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CarWithPricing {
  id: string;
  name: string;
  brand: { name: string };
  pricing: {
    dailyPrice: string;
    includedKmPerDay: number;
    extraKmPrice: string;
    extraHourPrice: string;
    hourlyPrice: string | null;
    gracePeriodMinutes: number;
  } | null;
}

/**
 * Shared by all five "*Pricing" sidebar items (24 Hour / Hourly / KM / Extra
 * KM / Extra Hour) — they're all facets of the same per-car `CarPricing`
 * config, so rather than five near-identical screens, this is one table with
 * an edit dialog covering the full config at once.
 */
export function CarPricingManager({ title, description }: { title: string; description: string }) {
  const [editing, setEditing] = React.useState<CarWithPricing | null>(null);
  const { data, isLoading } = useCarList<CarWithPricing>({ page: 1, limit: 100 });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>24hr Price</TableHead>
                <TableHead>Included KM</TableHead>
                <TableHead>Extra KM</TableHead>
                <TableHead>Extra Hour</TableHead>
                <TableHead>Hourly</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
                    No cars yet — add one under Car Rental &gt; Add New Car.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">
                      {car.brand.name} {car.name}
                    </TableCell>
                    {car.pricing ? (
                      <>
                        <TableCell>₹{Number(car.pricing.dailyPrice).toLocaleString("en-IN")}</TableCell>
                        <TableCell>{car.pricing.includedKmPerDay} km</TableCell>
                        <TableCell>₹{Number(car.pricing.extraKmPrice)}</TableCell>
                        <TableCell>₹{Number(car.pricing.extraHourPrice)}</TableCell>
                        <TableCell>{car.pricing.hourlyPrice ? `₹${Number(car.pricing.hourlyPrice)}` : "—"}</TableCell>
                        <TableCell>{car.pricing.gracePeriodMinutes}m</TableCell>
                      </>
                    ) : (
                      <TableCell colSpan={6}>
                        <Badge variant="warning">Not configured</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(car)}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <CarPricingDialog
          carId={editing.id}
          carName={`${editing.brand.name} ${editing.name}`}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
