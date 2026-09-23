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
  companyContentSchema,
  homepageContentSchema,
  type CompanyContent,
  type HomepageContent,
} from "@/modules/settings/site-content.schemas";
import { RepeatableList } from "@/components/admin/repeatable-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_CONTENT: HomepageContent = {
  hero: {
    badge: "",
    title: "DRIVE YOUR WAY.",
    highlightWord: "",
    subtitle: "",
    primaryCtaLabel: "Book a Car",
    primaryCtaHref: "/cars",
    secondaryCtaLabel: "Explore Fleet",
    secondaryCtaHref: "/cars",
    backgroundImageUrl: "",
  },
  trustBadges: [],
  philosophy: { badge: "", title: "MORE THAN A CAR RENTAL.", paragraph1: "", paragraph2: "", imageUrl: "", stats: [] },
  whyChooseUs: { badge: "", title: "WHY DRIVE WITH US?", subtitle: "", items: [] },
  b2b: { badge: "", title: "BUILT FOR BUSINESS.", subtitle: "", ctaLabel: "Partner With Us", ctaHref: "/contact-us", items: [] },
  videoShowcase: { badge: "", title: "THE ROAD IS YOURS.", subtitle: "", videoUrl: "" },
};

const DEFAULT_COMPANY: CompanyContent = {
  name: "SRM Car Rentals",
  tagline: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  socialLinks: { instagram: "", facebook: "", youtube: "", whatsapp: "" },
  footerLinks: { services: [], carsAndBrands: [], company: [] },
};

export default function HomepageContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Homepage Content</h1>
        <p className="text-muted-foreground text-sm">
          Everything shown on the public homepage — nothing is hardcoded. Changes go live immediately.
        </p>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Homepage Sections</TabsTrigger>
          <TabsTrigger value="company">Company & Footer</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <HomepageContentForm />
        </TabsContent>
        <TabsContent value="company">
          <CompanyContentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HomepageContentForm() {
  const { data, isLoading } = useSiteSetting<HomepageContent>("homepage.content");
  const save = useSaveSiteSetting<HomepageContent>("homepage.content");

  const form = useForm<HomepageContent>({
    resolver: zodResolver(homepageContentSchema as z.ZodType<HomepageContent, HomepageContent>),
    defaultValues: DEFAULT_CONTENT,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: HomepageContent) {
    try {
      await save.mutateAsync(values);
      toast.success("Homepage content saved");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save");
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>The top banner customers see first.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="hero.badge" label="Top Badge Text" />
            <TextField control={form.control} name="hero.title" label="Headline" />
            <TextField control={form.control} name="hero.subtitle" label="Subtitle" area className="sm:col-span-2" />
            <TextField control={form.control} name="hero.primaryCtaLabel" label="Primary Button Label" />
            <TextField control={form.control} name="hero.primaryCtaHref" label="Primary Button Link" />
            <TextField control={form.control} name="hero.secondaryCtaLabel" label="Secondary Button Label" />
            <TextField control={form.control} name="hero.secondaryCtaHref" label="Secondary Button Link" />
            <TextField control={form.control} name="hero.backgroundImageUrl" label="Background Image URL" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trust Badges</CardTitle>
            <CardDescription>The small row of trust indicators under the hero (e.g. Sanitised & Insured).</CardDescription>
          </CardHeader>
          <CardContent>
            <RepeatableList
              control={form.control}
              name="trustBadges"
              emptyItem={{ icon: "ShieldCheck", label: "" }}
              addLabel="Add trust badge"
              renderItem={(i) => (
                <div className="grid grid-cols-2 gap-2">
                  <TextField control={form.control} name={`trustBadges.${i}.icon`} label="Icon name" small />
                  <TextField control={form.control} name={`trustBadges.${i}.label`} label="Label" small />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Philosophy / About Section</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="philosophy.badge" label="Badge Text" />
              <TextField control={form.control} name="philosophy.title" label="Title" />
              <TextField control={form.control} name="philosophy.imageUrl" label="Image URL" />
            </div>
            <TextField control={form.control} name="philosophy.paragraph1" label="Paragraph 1" area />
            <TextField control={form.control} name="philosophy.paragraph2" label="Paragraph 2" area />
            <div>
              <FormLabel className="mb-2 block">Stats (e.g. &quot;10+ Years of Excellence&quot;)</FormLabel>
              <RepeatableList
                control={form.control}
                name="philosophy.stats"
                emptyItem={{ value: "", label: "" }}
                addLabel="Add stat"
                renderItem={(i) => (
                  <div className="grid grid-cols-2 gap-2">
                    <TextField control={form.control} name={`philosophy.stats.${i}.value`} label="Value" small />
                    <TextField control={form.control} name={`philosophy.stats.${i}.label`} label="Label" small />
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <IconCardsSection
          control={form.control}
          title="Why Choose Us Section"
          basePath="whyChooseUs"
        />

        <IconCardsSection
          control={form.control}
          title="Built For Business (B2B) Section"
          basePath="b2b"
          extraFields={
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="b2b.ctaLabel" label="Button Label" />
              <TextField control={form.control} name="b2b.ctaHref" label="Button Link" />
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Cinematic Video Showcase</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="videoShowcase.badge" label="Badge Text" />
            <TextField control={form.control} name="videoShowcase.title" label="Title" />
            <TextField control={form.control} name="videoShowcase.subtitle" label="Subtitle" area className="sm:col-span-2" />
            <TextField control={form.control} name="videoShowcase.videoUrl" label="Video URL (mp4)" />
          </CardContent>
        </Card>

        <Button type="submit" disabled={save.isPending} className="w-fit">
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Homepage Content
        </Button>
      </form>
    </Form>
  );
}

function IconCardsSection({
  control,
  title,
  basePath,
  extraFields,
}: {
  control: ReturnType<typeof useForm<HomepageContent>>["control"];
  title: string;
  basePath: "whyChooseUs" | "b2b";
  extraFields?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={`${basePath}.badge`} label="Badge Text" />
          <TextField control={control} name={`${basePath}.title`} label="Title" />
          <TextField control={control} name={`${basePath}.subtitle`} label="Subtitle" area className="sm:col-span-2" />
        </div>
        {extraFields}
        <div>
          <FormLabel className="mb-2 block">Cards</FormLabel>
          <RepeatableList
            control={control}
            name={`${basePath}.items`}
            emptyItem={{ icon: "Sparkles", title: "", description: "" }}
            addLabel="Add card"
            renderItem={(i) => (
              <div className="grid gap-2 sm:grid-cols-3">
                <TextField control={control} name={`${basePath}.items.${i}.icon`} label="Icon name" small />
                <TextField control={control} name={`${basePath}.items.${i}.title`} label="Title" small />
                <TextField control={control} name={`${basePath}.items.${i}.description`} label="Description" small />
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyContentForm() {
  const { data, isLoading } = useSiteSetting<CompanyContent>("homepage.company");
  const save = useSaveSiteSetting<CompanyContent>("homepage.company");

  const form = useForm<CompanyContent>({
    resolver: zodResolver(companyContentSchema as z.ZodType<CompanyContent, CompanyContent>),
    defaultValues: DEFAULT_COMPANY,
  });

  React.useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  async function onSubmit(values: CompanyContent) {
    try {
      await save.mutateAsync(values);
      toast.success("Company content saved");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save");
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Company & Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="name" label="Company Name" />
            <TextField control={form.control} name="tagline" label="Tagline" />
            <TextField control={form.control} name="description" label="Footer Description" area className="sm:col-span-2" />
            <TextField control={form.control} name="phone" label="Phone" />
            <TextField control={form.control} name="email" label="Email" />
            <TextField control={form.control} name="address" label="Address" area className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="socialLinks.instagram" label="Instagram URL" />
            <TextField control={form.control} name="socialLinks.facebook" label="Facebook URL" />
            <TextField control={form.control} name="socialLinks.youtube" label="YouTube URL" />
            <TextField control={form.control} name="socialLinks.whatsapp" label="WhatsApp Link" />
          </CardContent>
        </Card>

        {(["services", "carsAndBrands", "company"] as const).map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="capitalize">{section === "carsAndBrands" ? "Cars & Brands" : section} Footer Links</CardTitle>
            </CardHeader>
            <CardContent>
              <RepeatableList
                control={form.control}
                name={`footerLinks.${section}`}
                emptyItem={{ label: "", href: "" }}
                addLabel="Add link"
                renderItem={(i) => (
                  <div className="grid grid-cols-2 gap-2">
                    <TextField control={form.control} name={`footerLinks.${section}.${i}.label`} label="Label" small />
                    <TextField control={form.control} name={`footerLinks.${section}.${i}.href`} label="URL" small />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        ))}

        <Button type="submit" disabled={save.isPending} className="w-fit">
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Company Content
        </Button>
      </form>
    </Form>
  );
}

// This form spans two differently-shaped settings objects (HomepageContent,
// CompanyContent) with deeply dynamic array paths (e.g. `trustBadges.${i}.icon`)
// that react-hook-form's Path<T> can't express statically — `any` here is a
// deliberate, contained escape hatch rather than fighting the type system
// across ~30 call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TextField({
  control,
  name,
  label,
  area,
  small,
  className,
}: {
  control: any;
  name: string;
  label: string;
  area?: boolean;
  small?: boolean;
  className?: string;
}) {
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
