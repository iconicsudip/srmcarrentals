"use client";

import { use } from "react";

import { useCar } from "@/hooks/use-cars";
import { CarForm, type CarDetailDto } from "@/components/admin/cars/car-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: car, isLoading } = useCar<CarDetailDto>(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!car) {
    return <p className="text-muted-foreground">Car not found.</p>;
  }

  return <CarForm car={car} />;
}
