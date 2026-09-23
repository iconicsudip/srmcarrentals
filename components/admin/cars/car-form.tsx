"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useLookupOptions } from "@/hooks/use-lookup-options";
import { useCreateCar, useUpdateCar } from "@/hooks/use-cars";
import { CarImageManager } from "@/components/admin/cars/car-image-manager";
import { SelectField } from "@/components/admin/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const carFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  slug: z.string().max(180).optional().or(z.literal("")),
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  brandId: z.string().min(1, "Brand is required"),
  modelId: z.string().min(1, "Model is required"),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  categoryId: z.string().min(1, "Category is required"),
  carTypeId: z.string().min(1, "Car type is required"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "MAINTENANCE"]),
  isFeatured: z.boolean(),
  seatOptionId: z.string().optional().or(z.literal("")),
  doorOptionId: z.string().optional().or(z.literal("")),
  cylinderOptionId: z.string().optional().or(z.literal("")),
  transmissionTypeId: z.string().optional().or(z.literal("")),
  fuelTypeId: z.string().optional().or(z.literal("")),
  steeringTypeId: z.string().optional().or(z.literal("")),
  carCapacityId: z.string().optional().or(z.literal("")),
  colorId: z.string().optional().or(z.literal("")),
  exteriorColorId: z.string().optional().or(z.literal("")),
  interiorColorId: z.string().optional().or(z.literal("")),
  featureIds: z.array(z.string()),
  safetyFeatureIds: z.array(z.string()),
});
type CarFormValues = z.infer<typeof carFormSchema>;

const OPTIONAL_FK_KEYS = [
  "slug",
  "shortDescription",
  "description",
  "seatOptionId",
  "doorOptionId",
  "cylinderOptionId",
  "transmissionTypeId",
  "fuelTypeId",
  "steeringTypeId",
  "carCapacityId",
  "colorId",
  "exteriorColorId",
  "interiorColorId",
] as const;

/** Blank strings from unselected optional <Select>s must become `undefined`
 * before hitting the API — the backend schema treats "" as an invalid id. */
function cleanPayload(values: CarFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  for (const key of OPTIONAL_FK_KEYS) {
    if (payload[key] === "") {
      payload[key] = key.endsWith("Id") ? null : undefined;
    }
  }
  return payload;
}

export interface CarDetailDto {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  year: number;
  status: string;
  isFeatured: boolean;
  brandId: string;
  modelId: string;
  categoryId: string;
  carTypeId: string;
  seatOptionId?: string | null;
  doorOptionId?: string | null;
  cylinderOptionId?: string | null;
  transmissionTypeId?: string | null;
  fuelTypeId?: string | null;
  steeringTypeId?: string | null;
  carCapacityId?: string | null;
  colorId?: string | null;
  exteriorColorId?: string | null;
  interiorColorId?: string | null;
  features: { feature: { id: string; name: string } }[];
  safetyFeatures: { safetyFeature: { id: string; name: string } }[];
}

function toDefaultValues(car?: CarDetailDto): CarFormValues {
  if (!car) {
    return {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      brandId: "",
      modelId: "",
      year: new Date().getFullYear(),
      categoryId: "",
      carTypeId: "",
      status: "DRAFT",
      isFeatured: false,
      seatOptionId: "",
      doorOptionId: "",
      cylinderOptionId: "",
      transmissionTypeId: "",
      fuelTypeId: "",
      steeringTypeId: "",
      carCapacityId: "",
      colorId: "",
      exteriorColorId: "",
      interiorColorId: "",
      featureIds: [],
      safetyFeatureIds: [],
    };
  }

  return {
    name: car.name,
    slug: car.slug,
    shortDescription: car.shortDescription ?? "",
    description: car.description ?? "",
    brandId: car.brandId,
    modelId: car.modelId,
    year: car.year,
    categoryId: car.categoryId,
    carTypeId: car.carTypeId,
    status: car.status as CarFormValues["status"],
    isFeatured: car.isFeatured,
    seatOptionId: car.seatOptionId ?? "",
    doorOptionId: car.doorOptionId ?? "",
    cylinderOptionId: car.cylinderOptionId ?? "",
    transmissionTypeId: car.transmissionTypeId ?? "",
    fuelTypeId: car.fuelTypeId ?? "",
    steeringTypeId: car.steeringTypeId ?? "",
    carCapacityId: car.carCapacityId ?? "",
    colorId: car.colorId ?? "",
    exteriorColorId: car.exteriorColorId ?? "",
    interiorColorId: car.interiorColorId ?? "",
    featureIds: car.features.map((f) => f.feature.id),
    safetyFeatureIds: car.safetyFeatures.map((f) => f.safetyFeature.id),
  };
}

interface EntityRow {
  id: string;
  name: string;
}
interface CountRow {
  id: string;
  count: number;
  label?: string | null;
}

export function CarForm({ car }: { car?: CarDetailDto }) {
  const router = useRouter();
  const isEdit = !!car;

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: toDefaultValues(car),
  });

  const createMutation = useCreateCar<{ id: string }>();
  const updateMutation = useUpdateCar<{ id: string }>(car?.id ?? "");
  const saving = createMutation.isPending || updateMutation.isPending;

  const brandId = form.watch("brandId");

  const brands = useLookupOptions<EntityRow>("/cars/brands", "name");
  const models = useLookupOptions<EntityRow>("/cars/models", "name", brandId ? { brandId } : undefined);
  const categories = useLookupOptions<EntityRow>("/cars/categories", "name");
  const carTypes = useLookupOptions<EntityRow>("/cars/types", "name");
  const transmissionTypes = useLookupOptions<EntityRow>("/cars/transmission-types", "name");
  const fuelTypes = useLookupOptions<EntityRow>("/cars/fuel-types", "name");
  const steeringTypes = useLookupOptions<EntityRow>("/cars/steering-types", "name");
  const carCapacities = useLookupOptions<EntityRow & { label: string }>("/cars/capacity", "label");
  const colors = useLookupOptions<EntityRow>("/cars/colors", "name");
  const seats = useLookupOptions<CountRow>("/cars/seats", "count");
  const cylinders = useLookupOptions<CountRow>("/cars/cylinders", "count");
  const doors = useLookupOptions<CountRow>("/cars/doors", "count");
  const features = useLookupOptions<EntityRow>("/cars/features", "name");
  const safetyFeatures = useLookupOptions<EntityRow>("/cars/safety-features", "name");

  const seatOptions = seats.rows.map((r) => ({ label: r.label || `${r.count} Seats`, value: r.id }));
  const cylinderOptions = cylinders.rows.map((r) => ({ label: r.label || `${r.count} Cylinders`, value: r.id }));
  const doorOptions = doors.rows.map((r) => ({ label: r.label || `${r.count} Doors`, value: r.id }));

  async function onSubmit(values: CarFormValues) {
    try {
      const payload = cleanPayload(values);
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success("Car updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Car created — now add photos below");
        router.push(`/admin/cars/${created.id}/edit`);
      }
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Something went wrong");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Edit Car" : "Add New Car"}</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/cars")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create car"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic">
          <TabsList className="flex-wrap">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="safety">Safety Features</TabsTrigger>
            {isEdit && <TabsTrigger value="images">Images</TabsTrigger>}
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Car Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Toyota Innova Crysta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="auto-generated from name if left blank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="One-line summary shown on listing cards" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Full car description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SelectField control={form.control} name="brandId" label="Brand" options={brands.options} />
                <SelectField
                  control={form.control}
                  name="modelId"
                  label="Model"
                  options={models.options}
                  disabled={!brandId}
                  placeholder={brandId ? "Select a model" : "Select a brand first"}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SelectField control={form.control} name="categoryId" label="Car Category" options={categories.options} />
                <SelectField control={form.control} name="carTypeId" label="Car Type" options={carTypes.options} />
                <SelectField
                  control={form.control}
                  name="status"
                  label="Status"
                  options={[
                    { label: "Draft", value: "DRAFT" },
                    { label: "Active", value: "ACTIVE" },
                    { label: "Inactive", value: "INACTIVE" },
                    { label: "Maintenance", value: "MAINTENANCE" },
                  ]}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Featured Car</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <SelectField control={form.control} name="seatOptionId" label="Seats" options={seatOptions} placeholder="Optional" />
                <SelectField control={form.control} name="doorOptionId" label="Doors" options={doorOptions} placeholder="Optional" />
                <SelectField control={form.control} name="cylinderOptionId" label="Cylinders" options={cylinderOptions} placeholder="Optional" />
                <SelectField control={form.control} name="transmissionTypeId" label="Transmission" options={transmissionTypes.options} placeholder="Optional" />
                <SelectField control={form.control} name="fuelTypeId" label="Fuel Type" options={fuelTypes.options} placeholder="Optional" />
                <SelectField control={form.control} name="steeringTypeId" label="Steering Type" options={steeringTypes.options} placeholder="Optional" />
                <SelectField control={form.control} name="carCapacityId" label="Car Capacity" options={carCapacities.options} placeholder="Optional" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <SelectField control={form.control} name="colorId" label="Color" options={colors.options} placeholder="Optional" />
                <SelectField control={form.control} name="exteriorColorId" label="Exterior Color" options={colors.options} placeholder="Optional" />
                <SelectField control={form.control} name="interiorColorId" label="Interior Color" options={colors.options} placeholder="Optional" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="featureIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {features.rows.map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="featureIds"
                            render={({ field }) => {
                              const checked = field.value?.includes(feature.id);
                              return (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      field.onChange(
                                        value
                                          ? [...field.value, feature.id]
                                          : field.value.filter((id) => id !== feature.id),
                                      );
                                    }}
                                    id={`feature-${feature.id}`}
                                  />
                                  <Label htmlFor={`feature-${feature.id}`} className="font-normal">
                                    {feature.name}
                                  </Label>
                                </div>
                              );
                            }}
                          />
                        ))}
                      </div>
                      {features.rows.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No features configured yet — add some under Car Rental &gt; Features.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="safetyFeatureIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {safetyFeatures.rows.map((sf) => (
                          <FormField
                            key={sf.id}
                            control={form.control}
                            name="safetyFeatureIds"
                            render={({ field }) => {
                              const checked = field.value?.includes(sf.id);
                              return (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      field.onChange(
                                        value ? [...field.value, sf.id] : field.value.filter((id) => id !== sf.id),
                                      );
                                    }}
                                    id={`safety-${sf.id}`}
                                  />
                                  <Label htmlFor={`safety-${sf.id}`} className="font-normal">
                                    {sf.name}
                                  </Label>
                                </div>
                              );
                            }}
                          />
                        ))}
                      </div>
                      {safetyFeatures.rows.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No safety features configured yet — add some under Car Rental &gt; Safety Features.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isEdit && (
            <TabsContent value="images">
              <Card>
                <CardContent className="pt-6">
                  <CarImageManager carId={car.id} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>
    </Form>
  );
}
