"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { blogs: number };
}

interface BlogSearchAndFilterProps {
  categories: Category[];
  activeCategory: string;
  currentSearch: string;
  currentTag?: string;
}

export function BlogSearchAndFilter({
  categories,
  activeCategory,
  currentSearch,
  currentTag,
}: BlogSearchAndFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(currentSearch);

  // Sync state if URL search param changes
  React.useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const updateFilters = (newCategory?: string, newSearch?: string, clearTag = false) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory !== undefined) {
      if (newCategory === "all") {
        params.delete("category");
      } else {
        params.set("category", newCategory);
      }
    }

    if (newSearch !== undefined) {
      if (!newSearch.trim()) {
        params.delete("search");
      } else {
        params.set("search", newSearch.trim());
      }
    }

    if (clearTag) {
      params.delete("tag");
    }

    // Reset pagination to page 1 whenever filters change
    params.delete("page");

    router.push(`/blog?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, searchValue);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative mx-auto w-full max-w-xl">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 size-5 text-white/40" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search road trips, destinations, SUV comparisons..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pr-24 pl-12 text-sm text-white placeholder-white/40 backdrop-blur-md outline-none transition-all focus:border-orange-500/50 focus:bg-white/10 focus:ring-1 focus:ring-orange-500"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                updateFilters(undefined, "");
              }}
              className="absolute right-14 text-white/40 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-orange-400"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category Pills Slider */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => updateFilters("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeCategory === "all"
              ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
              : "border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
          }`}
        >
          All Topics
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateFilters(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                  : "border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{cat.name}</span>
              {cat._count?.blogs ? (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-black/20 text-black" : "bg-white/10 text-white/50"
                  }`}
                >
                  {cat._count.blogs}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Active tag indicator if filtered by tag */}
      {currentTag && (
        <div className="flex items-center justify-center gap-2 text-xs text-white/60">
          <span>Filtering by tag:</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 font-semibold text-orange-400">
            #{currentTag}
            <button
              type="button"
              onClick={() => updateFilters(undefined, undefined, true)}
              className="ml-1 text-orange-400 hover:text-orange-200"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
