"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useSaveSiteSetting, useSiteSetting } from "@/hooks/use-site-content";
import {
  aboutPageContentSchema,
  type AboutPageContent,
} from "@/modules/settings/site-content.schemas";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_ABOUT: AboutPageContent = {
  hero: {
    badge: "ABOUT SRM CAR RENTALS",
    title: "DRIVE WITH CONFIDENCE & FREEDOM",
    subtitle: "Your trusted partner for self-drive and chauffeur-driven car rentals across Rajasthan and Gujarat.",
  },
  stats: [
    { value: "500+", label: "Happy Customers" },
    { value: "28+", label: "Cars in Fleet" },
    { value: "3", label: "Cities" },
    { value: "24/7", label: "Support" },
  ],
  story: {
    badge: "OUR STORY",
    title: "Redefining Mobility in Rajasthan",
    paragraph1: "Founded with a passion for automotive excellence and authentic hospitality, SRM Car Rentals is Udaipur's premier self-drive car rental agency.",
    paragraph2: "We deliver pristine, fully insured vehicles with complete freedom. Transparent terms, instant confirmation, and 24/7 support.",
    imageUrl: "",
  },
  features: [],
  branches: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TextField({ control, name, label, area, small, className }: { control: any; name: string; label: string; area?: boolean; small?: boolean; className?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {!small && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {area ? (
              <Textarea placeholder={small ? label : undefined} rows={3} {...field} value={field.value ?? ""} />
            ) : (
              <Input placeholder={small ? label : undefined} {...field} value={field.value ?? ""} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function AboutContentPage() {
  const { data, isLoading } = useSiteSetting<AboutPageContent>("pages.about");
  const saveMutation = useSaveSiteSetting<AboutPageContent>("pages.about");

  const form = useForm<AboutPageContent>({
    resolver: zodResolver(aboutPageContentSchema as z.ZodType<AboutPageContent, AboutPageContent>),
    defaultValues: DEFAULT_ABOUT,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: AboutPageContent) {
    try {
      await saveMutation.mutateAsync(values);
      toast.success("About Us page content saved successfully");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to save content");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">About Us Page Content</h1>
        <p className="text-muted-foreground text-sm">
          Manage marketing text, company statistics, story, key features, and branch offices.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save Changes
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hero Banner</CardTitle>
              <CardDescription>Top header banner on the public /about-us page</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <TextField control={form.control} name="hero.badge" label="Badge Text" />
              <TextField control={form.control} name="hero.title" label="Main Title" />
              <TextField control={form.control} name="hero.subtitle" label="Subtitle" area />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fleet & Business Stats</CardTitle>
              <CardDescription>Key metrics displayed in the stats grid</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="stats"
                emptyItem={{ value: "100+", label: "New Metric" }}
                addLabel="Add statistic"
                renderItem={(i) => (
                  <div className="grid grid-cols-2 gap-2">
                    <TextField control={form.control} name={`stats.${i}.value`} label="Value (e.g. 28+)" small />
                    <TextField control={form.control} name={`stats.${i}.label`} label="Label" small />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Story & Mission</CardTitle>
              <CardDescription>Story narrative shown in the About section</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <TextField control={form.control} name="story.badge" label="Story Badge" />
              <TextField control={form.control} name="story.title" label="Story Title" />
              <TextField control={form.control} name="story.paragraph1" label="Paragraph 1" area />
              <TextField control={form.control} name="story.paragraph2" label="Paragraph 2" area />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Value Propositions & Features</CardTitle>
              <CardDescription>Highlights why customers choose SRM</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="features"
                emptyItem={{ icon: "🚗", title: "Feature Title", description: "Feature description..." }}
                addLabel="Add feature"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <TextField control={form.control} name={`features.${i}.icon`} label="Icon / Emoji" small />
                    <TextField control={form.control} name={`features.${i}.title`} label="Title" className="sm:col-span-3" small />
                    <TextField control={form.control} name={`features.${i}.description`} label="Description" className="col-span-full" area small />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Offices</CardTitle>
              <CardDescription>Branch locations displayed on the About page</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="branches"
                emptyItem={{ city: "City", phone: "+91 ...", address: "Full address", mapUrl: "" }}
                addLabel="Add branch"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <TextField control={form.control} name={`branches.${i}.city`} label="City" small />
                    <TextField control={form.control} name={`branches.${i}.phone`} label="Phone" small />
                    <TextField control={form.control} name={`branches.${i}.address`} label="Address" className="col-span-full" small />
                    <TextField control={form.control} name={`branches.${i}.mapUrl`} label="Google Maps Link" className="col-span-full" small />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pb-8">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
