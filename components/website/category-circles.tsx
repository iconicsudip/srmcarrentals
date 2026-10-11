import Image from "next/image";
import Link from "next/link";
import { CategoryIllustration } from "@/components/website/category-illustration";

export interface CategoryCircle {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  carCount: number;
}

/** Row of round category badges (photo + name + count) linking to that category's cars. */
export function CategoryCircles({ categories }: { categories: CategoryCircle[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1520px] px-4 pt-14 sm:px-6 lg:px-8">
      <div className="flex gap-6 overflow-x-auto pb-3 [scrollbar-width:none] sm:justify-center sm:gap-10 [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: "x proximity" }}>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/cars?category=${c.slug}`}
            className="group flex w-[88px] shrink-0 flex-col items-center gap-3 text-center sm:w-[120px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <span className="relative flex size-[88px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-neutral-900/10 ring-2 ring-orange-500/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-orange-500 group-hover:shadow-xl group-hover:shadow-orange-500/25 sm:size-[120px]">
              {c.imageUrl ? (
                <Image src={c.imageUrl} alt={c.name} fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <CategoryIllustration name={c.name} className="w-[78%] transition-transform duration-500 group-hover:scale-110" />
              )}
            </span>
            <span>
              <span className="block text-sm font-black tracking-wide text-neutral-900 uppercase transition-colors group-hover:text-orange-600">{c.name}</span>
              <span className="block text-[11px] font-medium text-neutral-500">
                {c.carCount} {c.carCount === 1 ? "car" : "cars"}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
