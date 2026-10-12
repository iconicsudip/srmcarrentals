import { RichText } from "@/components/website/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedPageBySlug } from "@/modules/cms/pages.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  const fallback: Metadata = {
    title: `${page.title} | SRM Car Rentals`,
    alternates: { canonical: `/${page.slug}` },
  };

  const resolved = await getDynamicSeoForPath(`/${page.slug}`, fallback);
  return resolved.metadata;
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <DynamicJsonLd path={`/${page.slug}`} />
      <h1 className="text-3xl font-black text-neutral-950 uppercase sm:text-4xl tracking-tight">{page.title}</h1>
      <RichText value={page.content} className="mt-8 text-sm leading-relaxed text-neutral-700 sm:text-base" />
    </div>
  );
}
