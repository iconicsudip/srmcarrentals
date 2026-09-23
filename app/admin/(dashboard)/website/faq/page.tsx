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
  faqPageContentSchema,
  type FaqPageContent,
} from "@/modules/settings/site-content.schemas";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_FAQ: FaqPageContent = {
  badge: "GOT QUESTIONS?",
  title: "FREQUENTLY ASKED QUESTIONS",
  subtitle: "Everything you need to know about self-drive rentals, deposits, fuel policy, and booking with SRM.",
  faqs: [],
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

export default function FaqContentPage() {
  const { data, isLoading } = useSiteSetting<FaqPageContent>("pages.faq");
  const saveMutation = useSaveSiteSetting<FaqPageContent>("pages.faq");

  const form = useForm<FaqPageContent>({
    resolver: zodResolver(faqPageContentSchema as z.ZodType<FaqPageContent, FaqPageContent>),
    defaultValues: DEFAULT_FAQ,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: FaqPageContent) {
    try {
      await saveMutation.mutateAsync(values);
      toast.success("FAQ content saved successfully");
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
        <h1 className="text-2xl font-semibold tracking-tight">Frequently Asked Questions (FAQ)</h1>
        <p className="text-muted-foreground text-sm">
          Manage questions and answers displayed on the homepage and the FAQ page.
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
              <CardTitle>Header Settings</CardTitle>
              <CardDescription>Heading text on the homepage FAQ section and /faq</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="badge" label="Badge Text" />
                <TextField control={form.control} name="title" label="Title" />
              </div>
              <TextField control={form.control} name="subtitle" label="Subtitle" area />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions & Answers</CardTitle>
              <CardDescription>Add, reorder, or edit FAQs</CardDescription>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name="faqs"
                emptyItem={{ id: `faq-${Date.now()}`, question: "New Question?", answer: "Answer text...", category: "General" }}
                addLabel="Add question"
                renderItem={(i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <TextField control={form.control} name={`faqs.${i}.question`} label="Question" className="sm:col-span-3" small />
                    <TextField control={form.control} name={`faqs.${i}.category`} label="Category" small />
                    <TextField control={form.control} name={`faqs.${i}.answer`} label="Answer" className="col-span-full" area small />
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
