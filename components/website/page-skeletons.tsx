import { Skeleton } from "@/components/ui/skeleton";

/** Thin gold bar that sweeps across the top while a route streams in. */
function TopProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-orange-500/10" role="progressbar" aria-label="Loading">
      <div className="h-full w-1/3 animate-[loadingBar_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
    </div>
  );
}

function HeadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function ListingPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1520px] space-y-10 px-4 py-16 sm:px-6 lg:px-8">
      <TopProgress />
      <HeadingSkeleton />
      <CardGridSkeleton />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
      <TopProgress />
      <div className="space-y-6">
        <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-3xl" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div>
      <TopProgress />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 pt-24 pb-10 text-center">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-14 w-full max-w-2xl" />
        <Skeleton className="h-14 w-4/5 max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="mt-4 h-40 w-full max-w-4xl rounded-3xl" />
      </div>
      <div className="mx-auto max-w-[1520px] px-4 py-12 sm:px-6 lg:px-8">
        <CardGridSkeleton count={3} />
      </div>
    </div>
  );
}
