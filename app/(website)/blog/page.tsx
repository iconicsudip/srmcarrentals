import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock, Compass, Fuel, ShieldCheck, Sparkles, Tag, User } from "lucide-react";

import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";
import { getPublicBlogs, getPublicBlogCategories } from "@/modules/website/public-content.service";
import { BlogSearchAndFilter } from "./blog-filter-client";

interface BlogHubPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    tag?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Blog & Travel Guides | SRM Car Rentals Rajasthan",
    description:
      "Explore expert travel itineraries, self-drive tips, SUV comparisons, and route guides for Udaipur, Kumbhalgarh, Mount Abu, and Rajasthan from SRM Car Rentals.",
    alternates: { canonical: "/blog" },
  };

  const resolved = await getDynamicSeoForPath("/blog", fallback);
  return resolved.metadata;
}

export default async function BlogHubPage({ searchParams }: BlogHubPageProps) {
  const params = await searchParams;
  const currentCategory = params.category || "all";
  const currentSearch = params.search || "";
  const currentTag = params.tag || "";
  const currentPage = parseInt(params.page || "1", 10) || 1;

  const [categories, blogsData] = await Promise.all([
    getPublicBlogCategories(),
    getPublicBlogs({
      categorySlug: currentCategory,
      search: currentSearch,
      tag: currentTag,
      page: currentPage,
      limit: 12,
    }),
  ]);

  const { items: blogs, total, totalPages } = blogsData;
  const featuredBlog = currentPage === 1 && !currentSearch && currentCategory === "all" && !currentTag ? blogs[0] : null;
  const regularBlogs = featuredBlog ? blogs.slice(1) : blogs;

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500/30">
      <DynamicJsonLd path="/blog" />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 pt-28 pb-20 sm:pt-36 sm:pb-24">
        {/* Subtle grid pattern background */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold tracking-widest text-orange-400 uppercase">
              <Compass className="size-3.5" />
              SRM Travel & Self-Drive Journal
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight uppercase sm:text-6xl lg:text-7xl">
              Road Trips, Guides & <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Rajasthan Travel Stories
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
              Insider self-drive itineraries, SUV comparisons, destination road guides, and essential rental tips for Udaipur, Mount Abu, Kumbhalgarh, and beyond.
            </p>
          </div>

          {/* Interactive Search & Category Filter Client Bar */}
          <div className="mt-12">
            <BlogSearchAndFilter
              categories={categories}
              activeCategory={currentCategory}
              currentSearch={currentSearch}
              currentTag={currentTag}
            />
          </div>
        </div>
      </section>

      {/* ── Main Content Section ── */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Featured Hero Card (Shown only on first page without search filters) */}
        {featuredBlog && (
          <section className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-orange-400 uppercase">
                <Sparkles className="size-4" />
                Featured Editorial
              </div>
            </div>

            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-950 p-1 sm:p-2 transition-all hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/5">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                {/* Featured Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl lg:col-span-7">
                  <Image
                    src={
                      featuredBlog.featuredImage ||
                      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80&auto=format&fit=crop"
                    }
                    alt={featuredBlog.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="rounded-full bg-orange-500/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-md">
                      {featuredBlog.category?.name || "Featured Guide"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center p-4 sm:p-6 lg:col-span-5">
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-orange-400" />
                      {new Date(featuredBlog.publishDate || featuredBlog.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-orange-400" />
                      {featuredBlog.readTimeMinutes} min read
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors sm:text-3xl lg:text-4xl">
                    <Link href={`/blog/${featuredBlog.slug}`}>
                      {featuredBlog.title}
                    </Link>
                  </h2>

                  <p className="mt-4 line-clamp-3 text-sm sm:text-base text-white/60 leading-relaxed">
                    {featuredBlog.content
                      .replace(/<[^>]*>/g, "")
                      .replace(/#+\s+/g, "")
                      .slice(0, 220)}
                    ...
                  </p>

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs uppercase border border-orange-500/30">
                        {featuredBlog.author?.firstName?.[0] || "S"}
                        {featuredBlog.author?.lastName?.[0] || "R"}
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white">
                          {featuredBlog.author?.firstName} {featuredBlog.author?.lastName}
                        </div>
                        <div className="text-white/40">SRM Editorial Team</div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredBlog.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-orange-400"
                    >
                      Read Full Article
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Regular Articles Section Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2 sm:text-2xl">
            <BookOpen className="size-5 text-orange-500" />
            {currentCategory !== "all"
              ? categories.find((c: any) => c.slug === currentCategory)?.name || "Category Articles"
              : currentSearch
              ? `Search Results for "${currentSearch}"`
              : "Latest Road Trip Guides & Tips"}
          </h2>
          <span className="text-xs font-semibold text-white/50 tracking-wider">
            {total} {total === 1 ? "Article" : "Articles"}
          </span>
        </div>

        {/* Blog Cards Grid */}
        {regularBlogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {regularBlogs.map((blog: any) => (
              <article
                key={blog.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-orange-500/5"
              >
                {/* Card Image */}
                <Link href={`/blog/${blog.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-800">
                  <Image
                    src={
                      blog.featuredImage ||
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=75&auto=format&fit=crop"
                    }
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
                  {blog.category && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400 backdrop-blur-md border border-white/10">
                        {blog.category.name}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-orange-400" />
                        {new Date(blog.publishDate || blog.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-orange-400" />
                        {blog.readTimeMinutes} min read
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black uppercase tracking-tight text-white transition-colors group-hover:text-orange-400 sm:text-xl line-clamp-2">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h3>

                    <p className="mt-3 text-sm text-white/60 leading-relaxed line-clamp-3">
                      {blog.content
                        .replace(/<[^>]*>/g, "")
                        .replace(/#+\s+/g, "")
                        .slice(0, 160)}
                      ...
                    </p>
                  </div>

                  {/* Footer info & CTA */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    {/* Tags preview */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {blog.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/50"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50 flex items-center gap-1.5">
                        <User className="size-3.5 text-white/40" />
                        <span>
                          {blog.author?.firstName || "SRM"} {blog.author?.lastName || "Expert"}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 transition-colors group-hover:text-orange-300"
                      >
                        Read More
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-12 text-center backdrop-blur-sm">
            <BookOpen className="mx-auto size-12 text-white/20" />
            <h3 className="mt-4 text-xl font-bold uppercase text-white">No Articles Found</h3>
            <p className="mt-2 text-sm text-white/50">
              Try adjusting your category filter or search keywords to find what you are looking for.
            </p>
            <div className="mt-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-orange-400 transition-colors"
              >
                Reset All Filters
              </Link>
            </div>
          </div>
        )}

        {/* ── Luxury Rental Fleet Promo Callout ── */}
        <section className="mt-20 overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-neutral-900 to-neutral-900 p-8 sm:p-12 relative">
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_right,rgba(249,115,22,0.15),transparent_70%)]"
            aria-hidden
          />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 uppercase tracking-widest border border-orange-500/30">
              <ShieldCheck className="size-3.5" />
              Direct From Fleet Owner
            </span>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Turn These Road Trips Into Your Next Adventure
            </h2>
            <p className="mt-4 text-base text-white/70 leading-relaxed">
              Book clean, inspected self-drive cars and SUVs in Udaipur with doorstep airport handover, 24/7 on-road mechanical assistance, and zero hidden charges.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/20"
              >
                Explore Self Drive Cars
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/car-rental"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10"
              >
                Book Chauffeur Taxi
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
