"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ApiRequestError } from "@/lib/api-client";
import { useSaveSiteSetting, useSiteSetting } from "@/hooks/use-site-content";
import { privacyPageContentSchema, type PrivacyPageContent } from "@/modules/settings/site-content.schemas";
import { DEFAULT_PRIVACY } from "@/modules/settings/privacy-defaults";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichField({ control, name, label, minHeight = 120 }: { control: any; name: string; label: string; minHeight?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="col-span-full">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RichTextEditor value={field.value ?? ""} onChange={field.onChange} minHeight={minHeight} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function PrivacyContentPage() {
  const { data, isLoading } = useSiteSetting<PrivacyPageContent>("pages.privacy");
  const saveMutation = useSaveSiteSetting<PrivacyPageContent>("pages.privacy");

  const form = useForm<PrivacyPageContent>({
    resolver: zodResolver(privacyPageContentSchema as z.ZodType<PrivacyPageContent, PrivacyPageContent>),
    defaultValues: DEFAULT_PRIVACY,
  });

  // Nothing saved yet → start from the default policy so it can be edited right away.
  React.useEffect(() => {
    if (isLoading) return;
    form.reset(data ? { ...DEFAULT_PRIVACY, ...data, hero: { ...DEFAULT_PRIVACY.hero, ...data.hero }, contact: { ...DEFAULT_PRIVACY.contact, ...data.contact } } : DEFAULT_PRIVACY);
  }, [data, isLoading, form]);

  async function onSubmit(values: PrivacyPageContent) {
    // keep each section's anchor id unique and in sync with its heading
    const used = new Set<string>();
    const sections = values.sections.map((s, i) => {
      let id = slugify(s.title) || `section-${i + 1}`;
      while (used.has(id)) id = `${id}-${i + 1}`;
      used.add(id);
      return { ...s, id };
    });
    try {
      await saveMutation.mutateAsync({ ...values, sections });
      toast.success("Privacy Policy saved — live on the website now");
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

  const saveButton = (
    <Button type="submit" disabled={saveMutation.isPending}>
      {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
      Save Changes
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Everything on the public /privacy-policy page can be edited here.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-end">{saveButton}</div>

          <Card>
            <CardHeader>
              <CardTitle>Header</CardTitle>
              <CardDescription>Banner at the top of the page</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="hero.badge" label="Badge Text" />
              <TextField control={form.control} name="hero.title" label="Title" />
              <TextField control={form.control} name="hero.subtitle" label="Subtitle" area className="sm:col-span-2" />
              <TextField control={form.control} name="lastUpdated" label="Last updated (e.g. 16 October 2026)" className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
              <CardDescription>Opening paragraph shown above the sections</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <RichField control={form.control} name="intro" label="Introduction" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Sections</CardTitle>
              <CardDescription>Numbered sections shown in order, with a contents list on the side. Use headings, bullet lists, bold and links in the editor.</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="sections"
                emptyItem={{ id: `section-${Date.now()}`, title: "New section", body: "" }}
                addLabel="Add section"
                renderItem={(i) => (
                  <div className="grid gap-3">
                    <TextField control={form.control} name={`sections.${i}.title`} label="Section Heading" />
                    <RichField control={form.control} name={`sections.${i}.body`} label="Content" minHeight={140} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Box</CardTitle>
              <CardDescription>Shown at the bottom. Email, phone and address come from Homepage → Company details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contact.show"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 sm:col-span-2">
                    <FormControl>
                      <input type="checkbox" className="size-4 accent-orange-500" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel className="!mt-0">Show contact box</FormLabel>
                  </FormItem>
                )}
              />
              <TextField control={form.control} name="contact.title" label="Heading" />
              <TextField control={form.control} name="contact.buttonLabel" label="Button Label" />
              <TextField control={form.control} name="contact.text" label="Text" area className="sm:col-span-2" />
              <TextField control={form.control} name="contact.buttonHref" label="Button Link" />
            </CardContent>
          </Card>

          <div className="flex justify-end pb-8">{saveButton}</div>
        </form>
      </Form>
    </div>
  );
}
