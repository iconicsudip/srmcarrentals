import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, ChevronRight, Clock, Compass, Phone, Sparkles, Tag } from "lucide-react";

import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";
import {
  getCompanyContent,
  getPublicBlogBySlug,
  getRelatedPublicBlogs,
} from "@/modules/website/public-content.service";
import { BlogContentRenderer } from "@/components/website/blog-content-renderer";
import { BlogShareButtons } from "@/components/website/blog-share-buttons";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublicBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Article Not Found | SRM Car Rentals",
    };
  }

  const excerpt = blog.content
    .replace(/<[^>]*>/g, "")
    .replace(/#+\s+/g, "")
    .slice(0, 160)
    .trim();

  const fallback: Metadata = {
    title: `${blog.title} | SRM Car Rentals Blog`,
    description: excerpt,
    alternates: { canonical: `/blog/${blog.slug}` },
    openGraph: {
      title: blog.title,
      description: excerpt,
      type: "article",
      publishedTime: (blog.publishDate || blog.createdAt)?.toISOString?.() || undefined,
      images: blog.featuredImage ? [{ url: blog.featuredImage }] : [],
    },
  };

  const resolved = await getDynamicSeoForPath(`/blog/${blog.slug}`, fallback);
  return resolved.metadata;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [blog, company] = await Promise.all([
    getPublicBlogBySlug(slug),
    getCompanyContent(),
  ]);

  if (!blog) {
    notFound();
  }

  const relatedBlogs = await getRelatedPublicBlogs(blog.slug, blog.categoryId, 3);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.in";
  const canonicalUrl = `${appUrl}/blog/${blog.slug}`;

  // Article JSON-LD Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.content
      .replace(/<[^>]*>/g, "")
      .replace(/#+\s+/g, "")
      .slice(0, 160),
    image: blog.featuredImage ? [blog.featuredImage] : [],
    datePublished: (blog.publishDate || blog.createdAt)?.toISOString?.() || new Date().toISOString(),
    dateModified: blog.updatedAt?.toISOString?.() || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: `${blog.author?.firstName || "SRM"} ${blog.author?.lastName || "Editorial"}`,
    },
    publisher: {
      "@type": "Organization",
      name: company.name || "SRM Car Rentals",
      logo: {
        "@type": "ImageObject",
        url: `${appUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 selection:bg-orange-500/20">
      <DynamicJsonLd path={`/blog/${blog.slug}`} />

      {/* Structured Schema script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* ── Breadcrumb & Back Navigation ── */}
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link href="/" className="hover:text-orange-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-neutral-300" />
            <Link href="/blog" className="hover:text-orange-600 transition-colors">
              Blog
            </Link>
            {blog.category && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-neutral-300" />
                <Link
                  href={`/blog?category=${blog.category.slug}`}
                  className="text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {blog.category.name}
                </Link>
              </>
            )}
          </nav>

          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to All Guides
          </Link>
        </div>
      </div>

      {/* ── Article Header ── */}
      <header className="relative pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Category & Read Time */}
          <div className="flex flex-wrap items-center gap-3">
            {blog.category && (
              <Link
                href={`/blog?category=${blog.category.slug}`}
                className="rounded-full bg-orange-500/10 border border-orange-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-600 hover:bg-orange-500/20 transition-colors"
              >
                {blog.category.name}
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="size-3.5 text-orange-500" />
              {blog.readTimeMinutes} min read
            </span>
          </div>

          {/* Main Title */}
          <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-neutral-950 sm:text-5xl sm:leading-tight lg:text-6xl">
            {blog.title}
          </h1>

          {/* Meta Bar: Author, Date, Social Sharing */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-neutral-200/80 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-600 font-bold text-sm uppercase border border-orange-500/20">
                {blog.author?.firstName?.[0] || "S"}
                {blog.author?.lastName?.[0] || "R"}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-950">
                  {blog.author?.firstName || "SRM"} {blog.author?.lastName || "Editorial"}
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-2">
                  <span>Verified Travel Desk</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-orange-500" />
                    {new Date(blog.publishDate || blog.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Share Client Component */}
            <BlogShareButtons title={blog.title} url={canonicalUrl} />
          </div>
        </div>
      </header>

      {/* ── Featured Cover Image ── */}
      {blog.featuredImage && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-100 shadow-xl">
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* ── Main Layout: Content + Sticky Sidebar ── */}
      <div className="mx-auto max-w-[1520px] px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Article Body */}
          <article className="lg:col-span-8 lg:pr-6">
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-10 shadow-sm">
              <BlogContentRenderer content={blog.content} />
            </div>

            {/* Tags footer */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                  <Tag className="size-3.5 text-orange-500" />
                  Related Article Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In-Article Road Trip Booking Banner */}
            <div className="mt-10 overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] via-white to-amber-500/[0.05] p-8 sm:p-10 shadow-sm relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-600 border border-orange-500/30">
                <Sparkles className="size-3" />
                Plan Your Journey
              </span>
              <h3 className="mt-3 text-2xl font-black uppercase text-neutral-950 sm:text-3xl">
                Ready to Drive This Route Yourself?
              </h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-xl">
                SRM Car Rentals provides clean, fully insured self-drive SUVs and hatchbacks with pickup at Udaipur Airport, Railway Station, or doorstep hotel delivery.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/cars"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                >
                  Book Self-Drive Car
                  <ArrowRight className="size-4" />
                </Link>
                {company.phone && (
                  <a
                    href={`tel:${company.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-colors shadow-sm"
                  >
                    <Phone className="size-3.5 text-orange-500" />
                    Call {company.phone}
                  </a>
                )}
              </div>
            </div>
          </article>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Quick Rental Card */}
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                    <Compass className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-black uppercase text-neutral-950">SRM Self-Drive Fleet</h4>
                    <p className="text-xs text-neutral-500">Udaipur & Rajasthan Mobility</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-neutral-200/80 pt-4 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Zero security deposit options available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Doorstep & Udaipur Airport delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>24/7 on-road mechanical assistance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>100% sanitized, commercial-insured cars</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/cars"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                  >
                    View Available Cars
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Author Card */}
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">About The Author</h4>
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 font-bold text-base border border-orange-500/20">
                    {blog.author?.firstName?.[0] || "S"}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-950 text-sm">
                      {blog.author?.firstName} {blog.author?.lastName}
                    </div>
                    <div className="text-xs text-orange-600">SRM Car Rentals Editorial</div>
                    <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                      Travel connoisseurs sharing firsthand driving guides, highway conditions, and destination road trips across Rajasthan and Gujarat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Related Articles ── */}
        {relatedBlogs.length > 0 && (
          <section className="mt-24 border-t border-neutral-200/80 pt-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Explore More</span>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-neutral-950 sm:text-3xl">
                  Related Road Trip Guides
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700"
              >
                All Articles
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedBlogs.map((item: any) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg"
                >
                  <Link href={`/blog/${item.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={
                        item.featuredImage ||
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=75&auto=format&fit=crop"
                      }
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    {item.category && (
                      <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 shadow-sm border border-neutral-200 backdrop-blur-md">
                        {item.category.name}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <Clock className="size-3 text-orange-500" />
                        <span>{item.readTimeMinutes} min read</span>
                      </div>

                      <h3 className="mt-2 text-base font-black uppercase tracking-tight text-neutral-950 transition-colors group-hover:text-orange-600 line-clamp-2">
                        <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                      </h3>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-neutral-200/80 pt-3">
                      <span className="text-xs text-neutral-500">
                        {item.author?.firstName} {item.author?.lastName}
                      </span>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-600 group-hover:text-orange-700"
                      >
                        Read
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
