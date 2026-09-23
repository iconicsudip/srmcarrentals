import { cn, stripTrailingPunctuation } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export function SectionHeading({ badge, title, subtitle, center, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", center && "items-center text-center", className)}>
      {badge && (
        <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-orange-500">
          {badge}
        </span>
      )}
      <h2 className="text-3xl leading-tight font-black tracking-tight text-white uppercase sm:text-4xl">
        {stripTrailingPunctuation(title)}
        <span className="text-orange-500">.</span>
      </h2>
      {subtitle && <p className={cn("max-w-xl text-white/50", center && "mx-auto")}>{subtitle}</p>}
    </div>
  );
}
