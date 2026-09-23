import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function PaginationBar({ page, totalPages, buildHref }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm text-white ${
          page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-white/10"
        }`}
      >
        <ChevronLeft className="size-4" /> Previous
      </Link>
      <span className="text-sm text-white/50">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm text-white ${
          page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-white/10"
        }`}
      >
        Next <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
