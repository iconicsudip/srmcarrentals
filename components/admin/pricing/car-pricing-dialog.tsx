"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useCarPricing, useSaveCarPricing } from "@/hooks/use-car-pricing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  dailyPrice: z.coerce.number().nonnegative(),
  includedKmPerDay: z.coerce.number().int().nonnegative(),
  extraKmPrice: z.coerce.number().nonnegative(),
  extraHourPrice: z.coerce.number().nonnegative(),
  hourlyPrice: z.coerce.number().nonnegative().optional(),
  minHourlyBookingHours: z.coerce.number().int().positive().optional(),
  gracePeriodMinutes: z.coerce.number(),
  extraHourRoundingMode: z.enum(["EXACT_HOUR", "ROUND_UP"]),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const DEFAULTS: FormInput = {
  dailyPrice: 0,
  includedKmPerDay: 300,
  extraKmPrice: 0,
  extraHourPrice: 0,
  gracePeriodMinutes: 0,
  extraHourRoundingMode: "ROUND_UP",
};

export function CarPricingDialog({ carId, carName, open, onOpenChange }: { carId: string; carName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useCarPricing(carId, open);
  const save = useSaveCarPricing(carId);

  const form = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(formSchema), defaultValues: DEFAULTS });

  React.useEffect(() => {
    if (data) {
      form.reset({
        dailyPrice: Number(data.dailyPrice),
        includedKmPerDay: data.includedKmPerDay,
        extraKmPrice: Number(data.extraKmPrice),
        extraHourPrice: Number(data.extraHourPrice),
        hourlyPrice: data.hourlyPrice ? Number(data.hourlyPrice) : undefined,
        minHourlyBookingHours: data.minHourlyBookingHours ?? undefined,
        gracePeriodMinutes: data.gracePeriodMinutes,
        extraHourRoundingMode: data.extraHourRoundingMode,
      });
    } else if (open && !isLoading) {
      form.reset(DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, open, isLoading]);

  async function onSubmit(values: FormOutput) {
    try {
      await save.mutateAsync(values);
      toast.success("Pricing saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save pricing");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pricing — {carName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <NumField control={form.control} name="dailyPrice" label="24 Hour Price (₹)" />
            <NumField control={form.control} name="includedKmPerDay" label="Included KM / Day" />
            <NumField control={form.control} name="extraKmPrice" label="Extra KM Price (₹)" />
            <NumField control={form.control} name="extraHourPrice" label="Extra Hour Price (₹)" />
            <NumField control={form.control} name="hourlyPrice" label="Hourly Price (₹, optional)" />
            <NumField control={form.control} name="minHourlyBookingHours" label="Min Hourly Booking (hrs)" />

            <FormField
              control={form.control}
              name="gracePeriodMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grace Period</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[0, 15, 30, 45, 60].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} minutes
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
              name="extraHourRoundingMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra Hour Rounding</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ROUND_UP">Round Up to Next Hour</SelectItem>
                      <SelectItem value="EXACT_HOUR">Charge Exact Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="size-4 animate-spin" />}
                Save Pricing
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NumField({ control, name, label }: { control: any; name: keyof FormInput; label: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
