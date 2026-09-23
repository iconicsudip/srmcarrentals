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
  contactPageContentSchema,
  type ContactPageContent,
} from "@/modules/settings/site-content.schemas";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_CONTACT: ContactPageContent = {
  hero: {
    badge: "GET IN TOUCH",
    title: "WE'RE HERE TO HELP",
    subtitle: "Have a question about vehicle availability, custom tour packages, or airport delivery? Reach out anytime.",
  },
  emergencyNotice: "Need urgent roadside assistance or emergency support? Call our 24/7 hotline: +91 9414551250",
  contactMethods: [],
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

export default function ContactContentPage() {
  const { data, isLoading } = useSiteSetting<ContactPageContent>("pages.contact");
  const saveMutation = useSaveSiteSetting<ContactPageContent>("pages.contact");

  const form = useForm<ContactPageContent>({
    resolver: zodResolver(contactPageContentSchema as z.ZodType<ContactPageContent, ContactPageContent>),
    defaultValues: DEFAULT_CONTACT,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: ContactPageContent) {
    try {
      await saveMutation.mutateAsync(values);
      toast.success("Contact page content saved successfully");
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
        <h1 className="text-2xl font-semibold tracking-tight">Contact Us Page Content</h1>
        <p className="text-muted-foreground text-sm">
          Manage contact info, telephone numbers, emails, branch offices, and business hours.
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
              <CardTitle>Page Header & Hotline</CardTitle>
              <CardDescription>Top banner and emergency helpline on /contact-us</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="hero.badge" label="Badge Text" />
                <TextField control={form.control} name="hero.title" label="Title" />
              </div>
              <TextField control={form.control} name="hero.subtitle" label="Subtitle" area />
              <TextField control={form.control} name="emergencyNotice" label="Emergency Hotline Banner" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct Channels</CardTitle>
              <CardDescription>Phone, WhatsApp, email cards shown at top of Contact page</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="contactMethods"
                emptyItem={{ icon: "📞", label: "Phone", value: "+91 ...", href: "tel:+91...", description: "Available 24/7" }}
                addLabel="Add channel"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <TextField control={form.control} name={`contactMethods.${i}.icon`} label="Icon" small />
                    <TextField control={form.control} name={`contactMethods.${i}.label`} label="Label" small />
                    <TextField control={form.control} name={`contactMethods.${i}.value`} label="Display Value" small />
                    <TextField control={form.control} name={`contactMethods.${i}.href`} label="Href link" small />
                    <TextField control={form.control} name={`contactMethods.${i}.description`} label="Description" className="col-span-full" small />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Offices & Showrooms</CardTitle>
              <CardDescription>All physical locations with phone numbers, hours, and map links</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="branches"
                emptyItem={{
                  city: "City",
                  state: "State",
                  phone: "+91 ...",
                  phone2: "",
                  address: "Full address",
                  mapUrl: "",
                  mapEmbed: "",
                  isHQ: false,
                  hours: "Mon–Sun: 7:00 AM – 9:30 PM",
                }}
                addLabel="Add branch office"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <TextField control={form.control} name={`branches.${i}.city`} label="City" small />
                    <TextField control={form.control} name={`branches.${i}.state`} label="State" small />
                    <TextField control={form.control} name={`branches.${i}.phone`} label="Primary Phone" small />
                    <TextField control={form.control} name={`branches.${i}.phone2`} label="Secondary Phone" small />
                    <TextField control={form.control} name={`branches.${i}.hours`} label="Working Hours" className="sm:col-span-2" small />
                    <TextField control={form.control} name={`branches.${i}.address`} label="Full Address" className="col-span-full" small />
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
