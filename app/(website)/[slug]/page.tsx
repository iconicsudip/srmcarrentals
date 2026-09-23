import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedPageBySlug } from "@/modules/cms/pages.service";

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) notFound();

  const paragraphs = page.content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white uppercase sm:text-4xl">{page.title}</h1>
      <div className="mt-8 flex flex-col gap-4 text-white/70">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
