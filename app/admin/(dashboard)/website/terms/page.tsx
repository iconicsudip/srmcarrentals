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
  termsPageContentSchema,
  type TermsPageContent,
} from "@/modules/settings/site-content.schemas";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_TERMS: TermsPageContent = {
  hero: {
    badge: "POLICIES & GUIDELINES",
    title: "TERMS & CONDITIONS",
    subtitle: "Clear, transparent rules for an effortless self-drive experience.",
  },
  importantNotice: "Confirmation of a booking implies full acceptance of all rental terms and conditions.",
  sections: [],
  cancellationTable: [],
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

export default function TermsContentPage() {
  const { data, isLoading } = useSiteSetting<TermsPageContent>("pages.terms");
  const saveMutation = useSaveSiteSetting<TermsPageContent>("pages.terms");

  const form = useForm<TermsPageContent>({
    resolver: zodResolver(termsPageContentSchema as z.ZodType<TermsPageContent, TermsPageContent>),
    defaultValues: DEFAULT_TERMS,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: TermsPageContent) {
    try {
      await saveMutation.mutateAsync(values);
      toast.success("Terms & Conditions saved successfully");
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
        <h1 className="text-2xl font-semibold tracking-tight">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm">
          Manage rental policies, driver eligibility, cancellation charges, and handover terms.
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
              <CardTitle>Header & Notice</CardTitle>
              <CardDescription>Top banner and important disclaimer on /terms-and-conditions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="hero.badge" label="Badge Text" />
                <TextField control={form.control} name="hero.title" label="Title" />
              </div>
              <TextField control={form.control} name="hero.subtitle" label="Subtitle" area />
              <TextField control={form.control} name="importantNotice" label="Important Notice Highlight" area />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancellation Policy Table</CardTitle>
              <CardDescription>Cancellation notice windows and corresponding fee percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="cancellationTable"
                emptyItem={{ notice: "Notice window", charge: "Charge %" }}
                addLabel="Add cancellation tier"
                renderItem={(i) => (
                  <div className="grid grid-cols-2 gap-2">
                    <TextField control={form.control} name={`cancellationTable.${i}.notice`} label="Notice Window" small />
                    <TextField control={form.control} name={`cancellationTable.${i}.charge`} label="Charge %" small />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Sections</CardTitle>
              <CardDescription>Eligibility, Speed Limits, Handover, Deposit, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="sections"
                emptyItem={{ id: `section-${Date.now()}`, emoji: "📋", title: "Section Title", points: [] }}
                addLabel="Add policy section"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <TextField control={form.control} name={`sections.${i}.emoji`} label="Emoji" small />
                    <TextField control={form.control} name={`sections.${i}.title`} label="Section Heading" className="sm:col-span-3" small />
                    <FormField
                      control={form.control}
                      name={`sections.${i}.points`}
                      render={({ field }) => (
                        <FormItem className="col-span-full">
                          <FormLabel className="text-xs">Rules & Points (One per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter points, one per line..."
                              rows={3}
                              value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
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
